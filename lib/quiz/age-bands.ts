/** Age-band helpers for child-safe quiz filtering. */

export type AgeBand = {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  /** Preferred difficulty labels for curated banks that still use easy/medium/hard. */
  difficulties: string[];
};

export const AGE_BANDS: AgeBand[] = [
  { id: "5-7", label: "Ages 5–7", minAge: 5, maxAge: 7, difficulties: ["easy"] },
  { id: "8-10", label: "Ages 8–10", minAge: 8, maxAge: 10, difficulties: ["medium"] },
  { id: "11-13", label: "Ages 11–13", minAge: 11, maxAge: 13, difficulties: ["hard"] },
  { id: "14-17", label: "Ages 14–17", minAge: 14, maxAge: 17, difficulties: ["hard"] },
  { id: "18+", label: "Ages 18+", minAge: 18, maxAge: 120, difficulties: ["hard"] },
];

export function parseAge(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < 5 || n > 120) return null;
  return n;
}

export function getAgeBand(age: number): AgeBand | null {
  return AGE_BANDS.find((b) => age >= b.minAge && age <= b.maxAge) || null;
}

/**
 * Safe fallback: only adjacent/lower bands — never serve harder/adult content to younger children.
 * Example: 8–10 may fall back to 5–7, never to 11–13.
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
  // Prefer Web Crypto when available (Edge/Node 19+); fallback for older Node.
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
