/**
 * Content safety + AI failure fallback tests.
 * Run: npm run test:quiz
 */
import test from "node:test";
import assert from "node:assert/strict";
import { checkChildSafeQuestion } from "../lib/quiz/content-safety";
import { getFallbackQuestionsForAge } from "../lib/quiz/fallback-bank";
import { generateAiQuestions, isQuizAiConfigured } from "../lib/quiz/ai-generate";
import { validateQuestionForAge } from "../lib/quiz/validate-question";

test("content safety blocks unsafe wording", () => {
  const bad = checkChildSafeQuestion({
    text: "Which weapon is the most powerful?",
    options: ["A", "B", "C", "D"],
  });
  assert.equal(bad.ok, false);
});

test("content safety allows child-friendly wording", () => {
  const good = checkChildSafeQuestion({
    text: "What color is a ripe banana?",
    options: ["Yellow", "Blue", "Black", "Purple"],
  });
  assert.equal(good.ok, true);
});

test("fallback bank returns age-grouped questions for key ages", () => {
  for (const age of [5, 6, 7, 10, 13, 16]) {
    const qs = getFallbackQuestionsForAge(age, 8);
    assert.ok(qs.length >= 6, `fallback too small for age ${age}`);
    for (const q of qs) {
      assert.ok(age >= q.minAge && age <= q.maxAge);
      const validated = validateQuestionForAge(age, {
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        category: q.category,
        difficulty: q.difficulty,
        minAge: q.minAge,
        maxAge: q.maxAge,
      });
      assert.equal(validated.ok, true, validated.ok ? "" : validated.reason);
    }
  }
});

test("AI generate without API key fails soft (fallback path)", async () => {
  const prev = process.env.QUIZ_AI_API_KEY;
  const prevOpen = process.env.OPENAI_API_KEY;
  delete process.env.QUIZ_AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    assert.equal(isQuizAiConfigured(), false);
    const result = await generateAiQuestions({ age: 7, count: 5 });
    assert.equal(result.usedAi, false);
    assert.equal(result.questions.length, 0);
    assert.match(String(result.error || ""), /not configured/i);
  } finally {
    if (prev != null) process.env.QUIZ_AI_API_KEY = prev;
    if (prevOpen != null) process.env.OPENAI_API_KEY = prevOpen;
  }
});

test("AI timeout / bad endpoint falls back empty (caller uses fallback bank)", async () => {
  const prevKey = process.env.QUIZ_AI_API_KEY;
  const prevBase = process.env.QUIZ_AI_BASE_URL;
  const prevTimeout = process.env.QUIZ_AI_TIMEOUT_MS;
  process.env.QUIZ_AI_API_KEY = "test-key-not-real";
  process.env.QUIZ_AI_BASE_URL = "http://127.0.0.1:9";
  process.env.QUIZ_AI_TIMEOUT_MS = "200";
  try {
    const result = await generateAiQuestions({ age: 10, count: 3 });
    assert.equal(result.usedAi, true);
    assert.equal(result.questions.length, 0);
    assert.ok(result.error);
    // Safe fallback bank still available independently
    const fb = getFallbackQuestionsForAge(10, 5);
    assert.ok(fb.length >= 5);
  } finally {
    if (prevKey == null) delete process.env.QUIZ_AI_API_KEY;
    else process.env.QUIZ_AI_API_KEY = prevKey;
    if (prevBase == null) delete process.env.QUIZ_AI_BASE_URL;
    else process.env.QUIZ_AI_BASE_URL = prevBase;
    if (prevTimeout == null) delete process.env.QUIZ_AI_TIMEOUT_MS;
    else process.env.QUIZ_AI_TIMEOUT_MS = prevTimeout;
  }
});
