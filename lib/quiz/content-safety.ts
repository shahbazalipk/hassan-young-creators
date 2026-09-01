/** Child-safe content filters for quiz questions (server-side only). */

const BLOCKED_PATTERNS: RegExp[] = [
  /\b(kill|murder|suicide|self[-\s]?harm|weapon|gun|bomb|terror|drugs?|alcohol|beer|wine|vodka|cigarette|vape|porn|sex|nude|naked|racist|slur)\b/i,
  /\b(gore|torture|molest|kidnap|bloodshed)\b/i,
  /\b(dating|girlfriend|boyfriend)\b/i,
];

const BLOCKED_TOPICS = [
  "violence",
  "adult",
  "gambling",
  "politics extreme",
  "self harm",
];

export type SafetyResult = { ok: true } | { ok: false; reason: string };

export function checkChildSafeText(text: string): SafetyResult {
  const raw = String(text || "").trim();
  if (!raw) return { ok: false, reason: "Empty text." };
  if (raw.length > 400) return { ok: false, reason: "Text too long." };

  for (const re of BLOCKED_PATTERNS) {
    if (re.test(raw)) {
      return { ok: false, reason: "Blocked unsafe wording." };
    }
  }

  const lower = raw.toLowerCase();
  for (const topic of BLOCKED_TOPICS) {
    if (lower.includes(topic)) {
      return { ok: false, reason: "Blocked unsafe topic." };
    }
  }

  return { ok: true };
}

export function checkChildSafeQuestion(input: {
  text: string;
  options: string[];
}): SafetyResult {
  const q = checkChildSafeText(input.text);
  if (!q.ok) return q;
  if (!Array.isArray(input.options) || input.options.length < 2) {
    return { ok: false, reason: "Need at least 2 options." };
  }
  if (input.options.length > 6) {
    return { ok: false, reason: "Too many options." };
  }
  for (const opt of input.options) {
    const s = checkChildSafeText(String(opt));
    if (!s.ok) return s;
  }
  return { ok: true };
}
