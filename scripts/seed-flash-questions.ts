import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import path from "node:path";

const prisma = new PrismaClient();

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashText(text: string) {
  return createHash("sha256").update(normalize(text)).digest("hex");
}

function ageRangeForDifficulty(difficulty: string): { minAge: number; maxAge: number } {
  if (difficulty === "easy") return { minAge: 5, maxAge: 7 };
  if (difficulty === "medium") return { minAge: 8, maxAge: 10 };
  return { minAge: 11, maxAge: 17 };
}

async function main() {
  const modulePath = pathToFileURL(
    path.join(process.cwd(), "public/flash-cards/js/questions.js")
  ).href;
  const mod = await import(modulePath);
  const rows = mod.DEFAULT_QUESTIONS as Array<{
    id: string;
    text: string;
    options: string[];
    correct: number;
    difficulty: string;
  }>;

  let upserted = 0;
  for (const q of rows) {
    const range = ageRangeForDifficulty(q.difficulty);
    await prisma.quizQuestion.upsert({
      where: { publicId: q.id },
      create: {
        publicId: q.id,
        app: "flash-cards",
        text: q.text,
        optionsJson: JSON.stringify(q.options),
        correctIndex: q.correct,
        minAge: range.minAge,
        maxAge: range.maxAge,
        difficulty: q.difficulty,
        category: "general",
        language: "en",
        source: "curated",
        contentHash: hashText(q.text),
        isActive: true,
      },
      update: {
        text: q.text,
        optionsJson: JSON.stringify(q.options),
        correctIndex: q.correct,
        minAge: range.minAge,
        maxAge: range.maxAge,
        difficulty: q.difficulty,
        contentHash: hashText(q.text),
      },
    });
    upserted += 1;
  }

  console.log(`Seeded/updated ${upserted} flash-cards questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
