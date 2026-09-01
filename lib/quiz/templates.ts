import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getAgeBand, normalizeQuestionText } from "@/lib/quiz/age-bands";

type TemplateSpec = {
  id: string;
  category: string;
  difficulty: string;
  minAge: number;
  maxAge: number;
  language: string;
  build: (seed: number) => {
    text: string;
    options: string[];
    correctIndex: number;
  };
};

function hashText(text: string) {
  return createHash("sha256").update(normalizeQuestionText(text)).digest("hex");
}

function uniqueOptions(correct: string | number, distractors: Array<string | number>) {
  const correctStr = String(correct);
  const opts = [correctStr];
  for (const d of distractors) {
    const s = String(d);
    if (!opts.includes(s)) opts.push(s);
    if (opts.length === 4) break;
  }
  while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
  return { options: opts, correctIndex: 0 };
}

/**
 * Parameterized templates — large variety without storing millions of rows.
 * Generated items are cached in QuizQuestion on first use (source: template).
 */
export const MATH_TEMPLATES: TemplateSpec[] = [
  {
    id: "count-tiny",
    category: "math",
    difficulty: "very_easy",
    minAge: 4,
    maxAge: 6,
    language: "en",
    build: (seed) => {
      const a = (seed % 5) + 1;
      const b = ((seed * 2) % 5) + 1;
      const correct = a + b;
      return {
        text: `What is ${a} + ${b}?`,
        ...uniqueOptions(correct, [correct + 1, Math.max(1, correct - 1), correct + 2]),
      };
    },
  },
  {
    id: "color-count",
    category: "general",
    difficulty: "very_easy",
    minAge: 4,
    maxAge: 6,
    language: "en",
    build: (seed) => {
      const colors = ["red", "blue", "green", "yellow", "orange", "purple"];
      const color = colors[seed % colors.length];
      return {
        text: `Which word is a color?`,
        options: [color, "run", "happy", "jump"].map((s) => s[0].toUpperCase() + s.slice(1)),
        correctIndex: 0,
      };
    },
  },
  {
    id: "add-small",
    category: "math",
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
    language: "en",
    build: (seed) => {
      const a = (seed % 20) + 5;
      const b = ((seed * 3) % 20) + 5;
      const correct = a + b;
      return {
        text: `What is ${a} + ${b}?`,
        ...uniqueOptions(correct, [correct + 1, correct - 1, correct + 10]),
      };
    },
  },
  {
    id: "sub-small",
    category: "math",
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
    language: "en",
    build: (seed) => {
      const a = (seed % 30) + 20;
      const b = ((seed * 5) % 15) + 1;
      const correct = a - b;
      return {
        text: `What is ${a} − ${b}?`,
        ...uniqueOptions(correct, [correct + 2, correct - 2, a + b]),
      };
    },
  },
  {
    id: "times-table",
    category: "math",
    difficulty: "moderate",
    minAge: 10,
    maxAge: 12,
    language: "en",
    build: (seed) => {
      const a = (seed % 10) + 2;
      const b = ((seed * 5) % 10) + 2;
      const correct = a * b;
      return {
        text: `What is ${a} × ${b}?`,
        ...uniqueOptions(correct, [correct + a, Math.max(1, correct - b), correct + 1]),
      };
    },
  },
  {
    id: "fraction-basic",
    category: "math",
    difficulty: "moderate",
    minAge: 10,
    maxAge: 12,
    language: "en",
    build: (seed) => {
      const whole = ((seed % 5) + 2) * 4;
      const correct = whole / 4;
      return {
        text: `What is 1/4 of ${whole}?`,
        ...uniqueOptions(correct, [whole / 2, correct + 1, whole]),
      };
    },
  },
  {
    id: "percent-basic",
    category: "math",
    difficulty: "intermediate",
    minAge: 13,
    maxAge: 15,
    language: "en",
    build: (seed) => {
      const base = ((seed % 9) + 1) * 10;
      const pct = [10, 20, 25, 50][seed % 4];
      const correct = (base * pct) / 100;
      return {
        text: `What is ${pct}% of ${base}?`,
        ...uniqueOptions(correct, [correct + 5, Math.max(0, correct - 5), correct * 2]),
      };
    },
  },
  {
    id: "linear-solve",
    category: "math",
    difficulty: "intermediate",
    minAge: 13,
    maxAge: 15,
    language: "en",
    build: (seed) => {
      const x = (seed % 9) + 2;
      const b = ((seed * 3) % 10) + 1;
      const a = 2;
      const rhs = a * x + b;
      return {
        text: `Solve for x: ${a}x + ${b} = ${rhs}`,
        ...uniqueOptions(x, [x + 1, x - 1, x + 2]),
      };
    },
  },
  {
    id: "algebra-advanced",
    category: "math",
    difficulty: "advanced",
    minAge: 16,
    maxAge: 120,
    language: "en",
    build: (seed) => {
      const x = (seed % 8) + 3;
      const rhs = 3 * (x - 2);
      return {
        text: `Solve: 3(x − 2) = ${rhs}`,
        ...uniqueOptions(x, [x + 1, x - 1, x + 2]),
      };
    },
  },
  {
    id: "log-basic",
    category: "math",
    difficulty: "advanced",
    minAge: 16,
    maxAge: 120,
    language: "en",
    build: (seed) => {
      const n = [2, 3, 4][seed % 3];
      const value = 10 ** n;
      return {
        text: `What is log₁₀(${value})?`,
        ...uniqueOptions(n, [n + 1, n - 1, n + 2]),
      };
    },
  },
];

/** Ensure cached generated template questions exist for an age band. */
export async function ensureGeneratedQuestions(app: string, age: number, count: number) {
  const band = getAgeBand(age);
  const templates = MATH_TEMPLATES.filter((t) => age >= t.minAge && age <= t.maxAge);
  if (!templates.length) return 0;

  let created = 0;
  const seeds = Math.max(count * 3, 24);
  for (const template of templates) {
    for (let seed = 1; seed <= seeds; seed += 1) {
      const built = template.build(seed + age * 17);
      const publicId = `gen_${template.id}_${age}_${seed}`;
      const contentHash = hashText(built.text);
      const existing = await prisma.quizQuestion.findUnique({ where: { publicId } });
      if (existing) continue;
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
          difficulty: band?.difficulty || template.difficulty,
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
