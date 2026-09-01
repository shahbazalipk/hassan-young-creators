import {
  getAgeBand,
  isAgeRangeSafeForLearner,
  isDifficultyAllowedForAge,
  type AgeBand,
} from "@/lib/quiz/age-bands";
import { checkChildSafeQuestion } from "@/lib/quiz/content-safety";

export type RawQuizQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
  category?: string;
  difficulty?: string;
  minAge?: number;
  maxAge?: number;
};

export type ValidatedQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: string;
  minAge: number;
  maxAge: number;
};

/**
 * Server-side age-band validation — never trust AI or client alone.
 */
export function validateQuestionForAge(
  age: number,
  raw: RawQuizQuestion
): { ok: true; question: ValidatedQuestion } | { ok: false; reason: string } {
  const band = getAgeBand(age);
  if (!band) return { ok: false, reason: "Unsupported age." };

  const text = String(raw.text || "").trim();
  const options = (raw.options || []).map((o) => String(o || "").trim()).filter(Boolean);
  const correctIndex = Number(raw.correctIndex);

  if (!text) return { ok: false, reason: "Missing question text." };
  if (text.length > band.maxQuestionChars) {
    return { ok: false, reason: `Question too long for ages ${band.id}.` };
  }
  if (options.length !== 4) {
    return { ok: false, reason: "Questions must have exactly 4 options." };
  }
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return { ok: false, reason: "Invalid correctIndex." };
  }
  if (new Set(options.map((o) => o.toLowerCase())).size < 4) {
    return { ok: false, reason: "Options must be unique." };
  }

  const safety = checkChildSafeQuestion({ text, options });
  if (!safety.ok) return { ok: false, reason: safety.reason };

  const minAge = Number.isFinite(raw.minAge) ? Number(raw.minAge) : band.minAge;
  const maxAge = Number.isFinite(raw.maxAge) ? Number(raw.maxAge) : band.maxAge;
  if (!isAgeRangeSafeForLearner(age, minAge, maxAge) && !(age >= minAge && age <= maxAge)) {
    // Require learner age inside declared range when provided.
    if (!(age >= minAge && age <= maxAge)) {
      return { ok: false, reason: "Question age range does not match learner." };
    }
  }
  if (!(age >= minAge && age <= maxAge)) {
    return { ok: false, reason: "Learner age outside question range." };
  }

  const difficulty = String(raw.difficulty || band.difficulty).toLowerCase();
  if (!isDifficultyAllowedForAge(age, difficulty)) {
    return { ok: false, reason: "Difficulty too hard for learner age." };
  }

  // Soft word-count check for youngest band.
  if (band.id === "4-6") {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 16) {
      return { ok: false, reason: "Too many words for ages 4–6." };
    }
  }

  return {
    ok: true,
    question: {
      text,
      options,
      correctIndex,
      category: String(raw.category || "general").slice(0, 40),
      difficulty: band.difficulty,
      minAge: band.minAge,
      maxAge: band.maxAge,
    },
  };
}

export function bandPromptBlock(band: AgeBand): string {
  return [
    `Target age band: ${band.label} (${band.id}).`,
    `Required difficulty label: ${band.difficulty}.`,
    `Max question length: ${band.maxQuestionChars} characters.`,
    band.promptHint,
    "Return ONLY safe educational content suitable for children/students.",
  ].join(" ");
}
