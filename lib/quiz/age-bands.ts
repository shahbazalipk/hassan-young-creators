/** Age-band helpers for child-safe quiz filtering. */

export type DifficultyLevel =
  | "very_easy"
  | "easy"
  | "moderate"
  | "intermediate"
  | "advanced";

export type AgeBand = {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  /** Canonical difficulty for this band. */
  difficulty: DifficultyLevel;
  /** Accepted difficulty aliases when matching curated/legacy banks. */
  difficulties: string[];
  /** Max question text length (characters) for age-appropriate wording. */
  maxQuestionChars: number;
  /** Guidance for AI / templates. */
  promptHint: string;
};

/**
 * Exact age → difficulty bands (product requirement).
 * Ages 4–6 very easy … 16+ advanced.
 */
export const AGE_BANDS: AgeBand[] = [
  {
    id: "4-6",
    label: "Ages 4–6",
    minAge: 4,
    maxAge: 6,
    difficulty: "very_easy",
    difficulties: ["very_easy"],
    maxQuestionChars: 90,
    promptHint:
      "Very young children. Use tiny words, short sentences, colors, animals, counting 1–10. No abstract ideas.",
  },
  {
    id: "7-9",
    label: "Ages 7–9",
    minAge: 7,
    maxAge: 9,
    difficulty: "easy",
    difficulties: ["easy", "very_easy"],
    maxQuestionChars: 120,
    promptHint:
      "Early elementary. Simple reading, add/subtract within 100, basic science facts, friendly tone.",
  },
  {
    id: "10-12",
    label: "Ages 10–12",
    minAge: 10,
    maxAge: 12,
    difficulty: "moderate",
    difficulties: ["moderate", "medium"],
    maxQuestionChars: 160,
    promptHint:
      "Upper elementary. Multiply/divide, fractions basics, geography, reading comprehension. Moderate challenge.",
  },
  {
    id: "13-15",
    label: "Ages 13–15",
    minAge: 13,
    maxAge: 15,
    difficulty: "intermediate",
    difficulties: ["intermediate", "hard", "medium_hard"],
    maxQuestionChars: 200,
    promptHint:
      "Middle school. Algebra basics, science concepts, world knowledge. Intermediate challenge, still child-safe.",
  },
  {
    id: "16+",
    label: "Ages 16+",
    minAge: 16,
    maxAge: 120,
    difficulty: "advanced",
    difficulties: ["advanced", "hard", "intermediate"],
    maxQuestionChars: 240,
    promptHint:
      "Older students. Advanced but school-appropriate STEM/general knowledge. No adult or unsafe topics.",
  },
];

/** Legacy Flash Cards difficulty labels → canonical. */
export function canonicalizeDifficulty(raw: string): DifficultyLevel | null {
  const d = String(raw || "")
    .trim()
    .toLowerCase();
  if (d === "very_easy" || d === "very-easy") return "very_easy";
  if (d === "easy") return "easy";
  if (d === "moderate" || d === "medium") return "moderate";
  if (d === "intermediate" || d === "hard" || d === "medium_hard" || d === "medium-hard") {
    return "intermediate";
  }
  if (d === "advanced") return "advanced";
  return null;
}

export function parseAge(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < 4 || n > 120) return null;
  return n;
}

export function getAgeBand(age: number): AgeBand | null {
  return AGE_BANDS.find((b) => age >= b.minAge && age <= b.maxAge) || null;
}

/**
 * Safe fallback: only equal/lower bands — never serve harder content to younger children.
 */
export function getSafeFallbackBands(age: number): AgeBand[] {
  const primary = getAgeBand(age);
  if (!primary) return [];
  const idx = AGE_BANDS.findIndex((b) => b.id === primary.id);
  const result: AgeBand[] = [primary];
  for (let i = idx - 1; i >= 0; i -= 1) {
    result.push(AGE_BANDS[i]);
  }
  return result;
}

/** True if a question's difficulty is allowed for this age (primary or softer fallback). */
export function isDifficultyAllowedForAge(age: number, difficulty: string): boolean {
  const bands = getSafeFallbackBands(age);
  const canonical = canonicalizeDifficulty(difficulty) || difficulty;
  return bands.some(
    (b) => b.difficulty === canonical || b.difficulties.includes(String(difficulty).toLowerCase())
  );
}

/** True if min/max age range is not harder than the learner's band. */
export function isAgeRangeSafeForLearner(learnerAge: number, minAge: number, maxAge: number): boolean {
  const learner = getAgeBand(learnerAge);
  if (!learner) return false;
  // Question must include the learner's age, OR be entirely within softer/equal bands.
  if (learnerAge >= minAge && learnerAge <= maxAge) return true;
  // Soft fallback: question maxAge must not exceed learner band max (no upward spill).
  return maxAge <= learner.maxAge && minAge <= learner.maxAge;
}

export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function hashNormalizedText(text: string): Promise<string> {
  const normalized = normalizeQuestionText(text);
  const data = new TextEncoder().encode(normalized);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(normalized).digest("hex");
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
