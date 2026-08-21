import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { normalizeQuestionText } from "@/lib/quiz/age-bands";

type TemplateSpec = {
  id: string;
  category: string;
  difficulty: string;
  minAge: number;
  maxAge: number;
  language: string;
  /** Build a concrete question from a seed integer. */
  build: (seed: number) => {
    text: string;
    options: string[];
    correctIndex: number;
  };
};

function hashText(text: string) {
  return createHash("sha256").update(normalizeQuestionText(text)).digest("hex");
}

/**
 * Lightweight parameterized templates — large variety without storing millions of rows.
 * Generated items are cached in QuizQuestion on first use.
 */
export const MATH_TEMPLATES: TemplateSpec[] = [
  {
    id: "add-small",
    category: "math",
    difficulty: "easy",
    minAge: 5,
    maxAge: 7,
    language: "en",
    build: (seed) => {
      const a = (seed % 9) + 1;
      const b = ((seed * 3) % 9) + 1;
      const correct = a + b;
      const options = [correct, correct + 1, Math.max(1, correct - 1), correct + 2].map(String);
      return {
        text: `What is ${a} + ${b}?`,
        options,
        correctIndex: 0,
      };
    },
  },
  {
    id: "times-table",
    category: "math",
    difficulty: "medium",
    minAge: 8,
    maxAge: 10,
    language: "en",
    build: (seed) => {
      const a = (seed % 10) + 2;
      const b = ((seed * 5) % 10) + 2;
      const correct = a * b;
      const options = [correct, correct + a, correct - b, correct + 1].map(String);
      return {
        text: `What is ${a} × ${b}?`,
        options,
        correctIndex: 0,
      };
    },
  },
  {
    id: "percent-basic",
    category: "math",
    difficulty: "hard",
    minAge: 11,
    maxAge: 17,
    language: "en",
    build: (seed) => {
      const base = ((seed % 9) + 1) * 10;
      const pct = [10, 20, 25, 50][seed % 4];
      const correct = (base * pct) / 100;
      const options = [correct, correct + 5, correct - 5, correct * 2].map(String);
      return {
        text: `What is ${pct}% of ${base}?`,
        options,
        correctIndex: 0,
      };
    },
  },
];

/** Ensure at least `count` cached generated questions exist for an age band. */
export async function ensureGeneratedQuestions(app: string, age: number, count: number) {
  const templates = MATH_TEMPLATES.filter((t) => age >= t.minAge && age <= t.maxAge);
  if (!templates.length) return 0;

  let created = 0;
  for (const template of templates) {
    for (let seed = 1; seed <= Math.max(count, 12); seed += 1) {
      const built = template.build(seed);
      const publicId = `gen_${template.id}_${seed}`;
      const contentHash = hashText(built.text);
      const existing = await prisma.quizQuestion.findUnique({ where: { publicId } });
      if (existing) continue;
      // Skip near-duplicates by content hash within app
      const dup = await prisma.quizQuestion.findFirst({
        where: { app, contentHash },
      });
      if (dup) continue;
      await prisma.quizQuestion.create({
        data: {
          publicId,
          app,
          text: built.text,
          optionsJson: JSON.stringify(built.options),
          correctIndex: built.correctIndex,
          minAge: template.minAge,
          maxAge: template.maxAge,
          difficulty: template.difficulty,
          category: template.category,
          language: template.language,
          source: "template",
          contentHash,
          isActive: true,
        },
      });
      created += 1;
    }
  }
  return created;
}
