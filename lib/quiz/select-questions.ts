import { prisma } from "@/lib/db";
import {
  getAgeBand,
  getSafeFallbackBands,
  parseAge,
  shuffleInPlace,
} from "@/lib/quiz/age-bands";
import { ensureGeneratedQuestions } from "@/lib/quiz/templates";

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

/**
 * Select unique age-safe questions for one quiz session.
 * Never spills to harder/older content for younger children.
 */
export async function selectQuestionsForPlayer(options: {
  app: string;
  playerKey: string;
  age: number;
  count: number;
}): Promise<{ questions: PublicQuizQuestion[]; internal: DbQuestion[]; ageBand: string } | { error: string }> {
  const age = parseAge(options.age);
  if (age == null) return { error: "Age must be a whole number between 5 and 120." };
  if (options.count < 1 || options.count > 40) return { error: "Question count must be between 1 and 40." };

  const band = getAgeBand(age);
  if (!band) return { error: "Age is outside supported bands." };

  // Hybrid scale: expand parameterized templates into cached DB rows as needed.
  await ensureGeneratedQuestions(options.app, age, options.count);

  const active = (await prisma.quizQuestion.findMany({
    where: { app: options.app, isActive: true },
  })) as DbQuestion[];

  const ageSafe = active.filter((q) => age >= q.minAge && age <= q.maxAge);
  if (!ageSafe.length) {
    return { error: "No age-appropriate questions are available right now." };
  }

  const recent = await prisma.questionHistory.findMany({
    where: { app: options.app, playerKey: options.playerKey },
    orderBy: { seenAt: "desc" },
    take: 200,
    select: { questionId: true },
  });
  const recentIds = new Set(recent.map((r) => r.questionId));

  const fallbacks = getSafeFallbackBands(age);
  const picked: DbQuestion[] = [];
  const used = new Set<string>();

  const take = (pool: DbQuestion[], preferFresh: boolean) => {
    const ordered = [
      ...shuffleInPlace(pool.filter((q) => !used.has(q.id) && (!preferFresh || !recentIds.has(q.id)))),
      ...shuffleInPlace(pool.filter((q) => !used.has(q.id) && recentIds.has(q.id))),
    ];
    for (const q of ordered) {
      if (picked.length >= options.count) break;
      if (used.has(q.id)) continue;
      used.add(q.id);
      picked.push(q);
    }
  };

  for (const fb of fallbacks) {
    take(
      ageSafe.filter((q) => fb.difficulties.includes(q.difficulty)),
      true
    );
    if (picked.length >= options.count) break;
  }

  if (picked.length < options.count) {
    take(ageSafe, false);
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
