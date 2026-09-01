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

function mapDifficulty(difficulty: string): {
  difficulty: string;
  minAge: number;
  maxAge: number;
} {
  const d = String(difficulty || "").toLowerCase();
  if (d === "very_easy" || d === "very-easy") {
    return { difficulty: "very_easy", minAge: 4, maxAge: 6 };
  }
  if (d === "easy") {
    return { difficulty: "easy", minAge: 7, maxAge: 9 };
  }
  if (d === "medium" || d === "moderate") {
    return { difficulty: "moderate", minAge: 10, maxAge: 12 };
  }
  if (d === "intermediate" || d === "medium_hard" || d === "medium-hard") {
    return { difficulty: "intermediate", minAge: 13, maxAge: 15 };
  }
  if (d === "advanced") {
    return { difficulty: "advanced", minAge: 16, maxAge: 18 };
  }
  // Legacy "hard" → intermediate (13–15); 16+ uses templates/AI/fallback advanced.
  return { difficulty: "intermediate", minAge: 13, maxAge: 15 };
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
    const mapped = mapDifficulty(q.difficulty);
    await prisma.quizQuestion.upsert({
      where: { publicId: q.id },
      create: {
        publicId: q.id,
        app: "flash-cards",
        text: q.text,
        optionsJson: JSON.stringify(q.options),
        correctIndex: q.correct,
        minAge: mapped.minAge,
        maxAge: mapped.maxAge,
        difficulty: mapped.difficulty,
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
        minAge: mapped.minAge,
        maxAge: mapped.maxAge,
        difficulty: mapped.difficulty,
        contentHash: hashText(q.text),
      },
    });
    upserted += 1;
  }

  // Dedicated easy band (7–9) curated seeds derived from medium wording where needed.
  const easyBandExtras = [
    {
      id: "ea_seed_01",
      text: "What is 8 + 7?",
      options: ["14", "15", "16", "17"],
      correct: 1,
    },
    {
      id: "ea_seed_02",
      text: "How many sides does a square have?",
      options: ["3", "4", "5", "6"],
      correct: 1,
    },
    {
      id: "ea_seed_03",
      text: "Which planet do we live on?",
      options: ["Mars", "Earth", "Jupiter", "Venus"],
      correct: 1,
    },
    {
      id: "ea_seed_04",
      text: "What is 20 − 9?",
      options: ["9", "10", "11", "12"],
      correct: 2,
    },
    {
      id: "ea_seed_05",
      text: "A week has how many days?",
      options: ["5", "6", "7", "8"],
      correct: 2,
    },
    {
      id: "ea_seed_06",
      text: "Which animal is known for hopping?",
      options: ["Elephant", "Kangaroo", "Whale", "Snake"],
      correct: 1,
    },
    {
      id: "ea_seed_07",
      text: "What is 6 × 3?",
      options: ["12", "15", "18", "21"],
      correct: 2,
    },
    {
      id: "ea_seed_08",
      text: "Ice is frozen…",
      options: ["Sand", "Water", "Air", "Metal"],
      correct: 1,
    },
    {
      id: "ea_seed_09",
      text: "Which word means the opposite of “big”?",
      options: ["Huge", "Small", "Tall", "Wide"],
      correct: 1,
    },
    {
      id: "ea_seed_10",
      text: "How many months are in a year?",
      options: ["10", "11", "12", "13"],
      correct: 2,
    },
  ];
  for (const q of easyBandExtras) {
    await prisma.quizQuestion.upsert({
      where: { publicId: q.id },
      create: {
        publicId: q.id,
        app: "flash-cards",
        text: q.text,
        optionsJson: JSON.stringify(q.options),
        correctIndex: q.correct,
        minAge: 7,
        maxAge: 9,
        difficulty: "easy",
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
        minAge: 7,
        maxAge: 9,
        difficulty: "easy",
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
