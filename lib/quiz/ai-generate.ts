/**
 * Server-only AI question generation.
 * API keys never leave the server (env vars only).
 *
 * Supported providers via OpenAI-compatible Chat Completions:
 *   QUIZ_AI_API_KEY or OPENAI_API_KEY
 *   QUIZ_AI_BASE_URL (default https://api.openai.com/v1)
 *   QUIZ_AI_MODEL (default gpt-4o-mini)
 */
import { getAgeBand, normalizeQuestionText, shuffleInPlace } from "@/lib/quiz/age-bands";
import { bandPromptBlock, validateQuestionForAge, type ValidatedQuestion } from "@/lib/quiz/validate-question";

export type AiGenerateResult = {
  questions: ValidatedQuestion[];
  usedAi: boolean;
  error?: string;
};

function aiConfig() {
  const apiKey = process.env.QUIZ_AI_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseUrl = (process.env.QUIZ_AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.QUIZ_AI_MODEL || "gpt-4o-mini";
  const timeoutMs = Number(process.env.QUIZ_AI_TIMEOUT_MS || 8000);
  return { apiKey, baseUrl, model, timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 8000 };
}

export function isQuizAiConfigured(): boolean {
  return Boolean(aiConfig().apiKey);
}

function extractJsonArray(text: string): unknown[] | null {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
  } catch {
    // fall through — try to find array substring
  }
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

export async function generateAiQuestions(options: {
  age: number;
  count: number;
  excludeNormalizedTexts?: Set<string>;
}): Promise<AiGenerateResult> {
  const band = getAgeBand(options.age);
  if (!band) return { questions: [], usedAi: false, error: "Unsupported age." };

  const { apiKey, baseUrl, model, timeoutMs } = aiConfig();
  if (!apiKey) {
    return { questions: [], usedAi: false, error: "AI not configured." };
  }

  const want = Math.min(Math.max(options.count, 1), 20);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const system = [
    "You generate multiple-choice quiz questions for children and students.",
    "Return ONLY valid JSON: an array of objects with keys text, options (array of 4 strings), correctIndex (0-3), category.",
    "No markdown, no commentary.",
    "All content must be child-safe, educational, and age-appropriate.",
    "Never include violence, adult themes, hate, self-harm, drugs, or weapons.",
    bandPromptBlock(band),
  ].join("\n");

  const user = [
    `Create ${want} unique ${band.difficulty} quiz questions for a learner age ${options.age}.`,
    "Vary subjects: math, science, vocabulary, geography, general knowledge.",
    "Keep wording suitable for the age band.",
    "Each options array must have exactly 4 distinct choices.",
  ].join(" ");

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        questions: [],
        usedAi: true,
        error: `AI HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`,
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content || "";
    const arr = extractJsonArray(content);
    if (!arr) {
      return { questions: [], usedAi: true, error: "AI returned unparseable content." };
    }

    const exclude = options.excludeNormalizedTexts || new Set<string>();
    const out: ValidatedQuestion[] = [];
    const seen = new Set<string>();

    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const row = item as {
        text?: string;
        options?: string[];
        correctIndex?: number;
        category?: string;
      };
      const validated = validateQuestionForAge(options.age, {
        text: String(row.text || ""),
        options: Array.isArray(row.options) ? row.options.map(String) : [],
        correctIndex: Number(row.correctIndex),
        category: row.category,
        difficulty: band.difficulty,
        minAge: band.minAge,
        maxAge: band.maxAge,
      });
      if (!validated.ok) continue;
      const norm = normalizeQuestionText(validated.question.text);
      if (!norm || seen.has(norm) || exclude.has(norm)) continue;
      seen.add(norm);
      out.push(validated.question);
      if (out.length >= want) break;
    }

    return {
      questions: shuffleInPlace(out),
      usedAi: true,
      error: out.length ? undefined : "AI produced no age-safe unique questions.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return { questions: [], usedAi: true, error: message };
  } finally {
    clearTimeout(timer);
  }
}
