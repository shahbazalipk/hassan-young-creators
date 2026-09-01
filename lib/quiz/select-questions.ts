import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  getAgeBand,
  getSafeFallbackBands,
  isDifficultyAllowedForAge,
  normalizeQuestionText,
  parseAge,
  shuffleInPlace,
} from "@/lib/quiz/age-bands";
import { generateAiQuestions } from "@/lib/quiz/ai-generate";
import { getFallbackQuestionsForAge } from "@/lib/quiz/fallback-bank";
import { ensureGeneratedQuestions } from "@/lib/quiz/templates";
import { validateQuestionForAge } from "@/lib/quiz/validate-question";

export type PublicQuizQuestion = {
  id: string;
  publicId: string;
  text: string;
  options: string[];
  category: string;
  difficulty: string;
  minAge: number;
  maxAge: number;
};

type DbQuestion = {
  id: string;
  publicId: string;
  text: string;
  optionsJson: string;
  correctIndex: number;
  minAge: number;
  maxAge: number;
  difficulty: string;
  category: string;
  isActive: boolean;
  contentHash?: string;
};

function toPublic(q: DbQuestion): PublicQuizQuestion {
  return {
    id: q.id,
    publicId: q.publicId,
    text: q.text,
    options: JSON.parse(q.optionsJson) as string[],
    category: q.category,
    difficulty: q.difficulty,
    minAge: q.minAge,
    maxAge: q.maxAge,
  };
}

function hashText(text: string) {
  return createHash("sha256").update(normalizeQuestionText(text)).digest("hex");
}

async function persistGenerated(
  app: string,
  q: {
    text: string;
    options: string[];
    correctIndex: number;
    category: string;
    difficulty: string;
    minAge: number;
    maxAge: number;
  },
  source: "generated" | "fallback"
): Promise<DbQuestion | null> {
  const contentHash = hashText(q.text);
  const existing = await prisma.quizQuestion.findFirst({
    where: { app, contentHash },
  });
  if (existing) return existing as DbQuestion;

  const publicId = `${source}_${contentHash.slice(0, 20)}`;
  try {
    return (await prisma.quizQuestion.create({
      data: {
        publicId,
        app,
        text: q.text,
        optionsJson: JSON.stringify(q.options),
        correctIndex: q.correctIndex,
        minAge: q.minAge,
        maxAge: q.maxAge,
        difficulty: q.difficulty,
        category: q.category,
        language: "en",
        source,
        contentHash,
        isActive: true,
      },
    })) as DbQuestion;
  } catch {
    const again = await prisma.quizQuestion.findFirst({ where: { app, contentHash } });
    return (again as DbQuestion) || null;
  }
}

/**
 * Select unique age-safe questions for one quiz session.
 * Order: AI (if configured) → DB curated/templates → in-memory fallback.
 * Never spills to harder/older content for younger children.
 * Excludes recently answered question IDs and normalized duplicate text.
 */
export async function selectQuestionsForPlayer(options: {
  app: string;
  playerKey: string;
  age: number;
  count: number;
  dateOfBirth?: Date | null;
  recentAccuracy?: number | null;
}): Promise<{ questions: PublicQuizQuestion[]; internal: DbQuestion[]; ageBand: string } | { error: string }> {
  const age = parseAge(options.age);
  if (age == null) return { error: "Age must be a whole number between 4 and 120." };
  if (options.count < 1 || options.count > 40) return { error: "Question count must be between 1 and 40." };

  const band = getAgeBand(age);
  if (!band) return { error: "Age is outside supported bands." };

  // Smooth within-band preference (never jumps to a harder band on a birthday).
  const { smoothDifficultyProgress } = await import("@/lib/age");
  const progress = smoothDifficultyProgress({
    age,
    dob: options.dateOfBirth || null,
    recentAccuracy: options.recentAccuracy ?? null,
  });

  await ensureGeneratedQuestions(options.app, age, options.count);

  // Bias soft-band mixing: new birthdays / lower progress stay gentler within the same band.
  const preferPrimaryOnly = progress >= 0.62;

  const recent = await prisma.questionHistory.findMany({
    where: { app: options.app, playerKey: options.playerKey },
    orderBy: { seenAt: "desc" },
    take: 200,
    select: { questionId: true },
  });
  const recentIds = new Set(recent.map((r) => r.questionId));

  const recentRows =
    recentIds.size > 0
      ? await prisma.quizQuestion.findMany({
          where: { id: { in: [...recentIds] } },
          select: { contentHash: true, text: true },
        })
      : [];
  const recentHashes = new Set(recentRows.map((r) => r.contentHash).filter(Boolean));
  const recentNorms = new Set(recentRows.map((r) => normalizeQuestionText(r.text)));

  const picked: DbQuestion[] = [];
  const usedIds = new Set<string>();
  const usedNorms = new Set<string>();

  const pushDb = (q: DbQuestion, preferFresh: boolean) => {
    if (picked.length >= options.count) return false;
    if (usedIds.has(q.id)) return false;
    const norm = normalizeQuestionText(q.text);
    if (usedNorms.has(norm)) return false;
    if (preferFresh && (recentIds.has(q.id) || recentHashes.has(q.contentHash || "") || recentNorms.has(norm))) {
      return false;
    }
    if (!isDifficultyAllowedForAge(age, q.difficulty)) return false;
    const inRange = age >= q.minAge && age <= q.maxAge;
    const softLower = q.maxAge <= band.maxAge && age >= q.minAge;
    if (!inRange && !softLower) return false;
    usedIds.add(q.id);
    usedNorms.add(norm);
    picked.push(q);
    return true;
  };

  // 1) AI pool (ephemeral diversity; validated server-side)
  const needFromAi = options.count;
  const ai = await generateAiQuestions({
    age,
    count: needFromAi,
    excludeNormalizedTexts: new Set([...recentNorms, ...usedNorms]),
  });
  for (const q of ai.questions) {
    if (picked.length >= options.count) break;
    const saved = await persistGenerated(options.app, q, "generated");
    if (saved) pushDb(saved, true);
  }

  // 2) Active DB questions (curated + templates + prior generated)
  const active = (await prisma.quizQuestion.findMany({
    where: { app: options.app, isActive: true },
  })) as DbQuestion[];

  const ageSafe = active.filter((q) => {
    if (!isDifficultyAllowedForAge(age, q.difficulty)) return false;
    // Exact age match preferred path
    if (age >= q.minAge && age <= q.maxAge) return true;
    // Soft lower-band only: question must not target older learners than this band
    return q.maxAge <= band.maxAge && age >= q.minAge;
  });

  const fallbacks = getSafeFallbackBands(age);
  const takeFromPool = (pool: DbQuestion[], preferFresh: boolean) => {
    const ordered = [
      ...shuffleInPlace(pool.filter((q) => !usedIds.has(q.id) && (!preferFresh || !recentIds.has(q.id)))),
      ...shuffleInPlace(pool.filter((q) => !usedIds.has(q.id) && recentIds.has(q.id))),
    ];
    for (const q of ordered) {
      pushDb(q, preferFresh && !recentIds.has(q.id) ? true : false);
      // When preferFresh exhausted, allow recent on second pass below
      if (picked.length >= options.count) break;
    }
  };

  for (const fb of fallbacks) {
    if (preferPrimaryOnly && fb.id !== band.id) continue;
    takeFromPool(
      ageSafe.filter((q) => fb.difficulties.includes(q.difficulty.toLowerCase()) || q.difficulty === fb.difficulty),
      true
    );
    if (picked.length >= options.count) break;
  }

  if (picked.length < options.count) {
    // Soft lower fill only after primary pool is exhausted (smooth, never upward).
    for (const fb of fallbacks) {
      if (fb.id === band.id) continue;
      takeFromPool(
        ageSafe.filter((q) => fb.difficulties.includes(q.difficulty.toLowerCase()) || q.difficulty === fb.difficulty),
        true
      );
      if (picked.length >= options.count) break;
    }
  }

  if (picked.length < options.count) {
    takeFromPool(ageSafe, false);
  }

  // 3) In-memory safe fallback bank
  if (picked.length < options.count) {
    const excludePublic = new Set(picked.map((q) => q.publicId));
    const fbQs = getFallbackQuestionsForAge(age, options.count - picked.length + 8, excludePublic);
    for (const fq of fbQs) {
      if (picked.length >= options.count) break;
      const validated = validateQuestionForAge(age, {
        text: fq.text,
        options: fq.options,
        correctIndex: fq.correctIndex,
        category: fq.category,
        difficulty: fq.difficulty,
        minAge: fq.minAge,
        maxAge: fq.maxAge,
      });
      if (!validated.ok) continue;
      const saved = await persistGenerated(
        options.app,
        {
          ...validated.question,
          // Keep fallback publicId stable when possible
        },
        "fallback"
      );
      if (saved) {
        // Prefer stable publicId from fallback bank
        if (saved.publicId !== fq.publicId) {
          pushDb(saved, true);
        } else {
          pushDb(saved, true);
        }
      }
    }
  }

  // Final pass: allow recent if still short
  if (picked.length < options.count) {
    takeFromPool(ageSafe, false);
  }

  if (!picked.length) {
    return { error: "No age-appropriate questions are available right now." };
  }

  const finalQs = shuffleInPlace(picked).slice(0, Math.min(options.count, picked.length));
  return {
    questions: finalQs.map(toPublic),
    internal: finalQs,
    ageBand: band.id,
  };
}

export async function recordQuestionHistory(app: string, playerKey: string, questionIds: string[]) {
  const now = new Date();
  for (const questionId of questionIds) {
    await prisma.questionHistory.upsert({
      where: {
        app_playerKey_questionId: { app, playerKey, questionId },
      },
      create: { app, playerKey, questionId, seenAt: now },
      update: { seenAt: now },
    });
  }

  const old = await prisma.questionHistory.findMany({
    where: { app, playerKey },
    orderBy: { seenAt: "desc" },
    skip: 300,
    select: { id: true },
  });
  if (old.length) {
    await prisma.questionHistory.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }
}
