/**
 * Server age-band unit tests.
 * Run: npm run test:quiz
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  getAgeBand,
  getSafeFallbackBands,
  isDifficultyAllowedForAge,
  parseAge,
} from "../lib/quiz/age-bands";
import { validateQuestionForAge } from "../lib/quiz/validate-question";
import { selectQuestions, ageToBand, DEFAULT_QUESTIONS } from "../public/flash-cards/js/questions.js";

const sampleAges = [5, 6, 7, 10, 13, 16];

test("parseAge accepts 4–120 and rejects below 4", () => {
  assert.equal(parseAge(4), 4);
  assert.equal(parseAge(5), 5);
  assert.equal(parseAge(3), null);
  assert.equal(parseAge(16), 16);
});

test("exact age maps to required product bands", () => {
  assert.equal(getAgeBand(5)?.id, "4-6");
  assert.equal(getAgeBand(5)?.difficulty, "very_easy");
  assert.equal(getAgeBand(6)?.difficulty, "very_easy");
  assert.equal(getAgeBand(7)?.id, "7-9");
  assert.equal(getAgeBand(7)?.difficulty, "easy");
  assert.equal(getAgeBand(10)?.id, "10-12");
  assert.equal(getAgeBand(10)?.difficulty, "moderate");
  assert.equal(getAgeBand(13)?.id, "13-15");
  assert.equal(getAgeBand(13)?.difficulty, "intermediate");
  assert.equal(getAgeBand(16)?.id, "16+");
  assert.equal(getAgeBand(16)?.difficulty, "advanced");
});

test("ages 5, 6, 7, 10 receive different primary difficulties", () => {
  const diffs = [5, 6, 7, 10].map((a) => getAgeBand(a)?.difficulty);
  assert.equal(diffs[0], "very_easy");
  assert.equal(diffs[1], "very_easy");
  assert.equal(diffs[2], "easy");
  assert.equal(diffs[3], "moderate");
  assert.notEqual(diffs[0], diffs[2]);
  assert.notEqual(diffs[2], diffs[3]);
});

test("safe fallback never includes harder bands", () => {
  const fb = getSafeFallbackBands(10).map((b) => b.id);
  assert.ok(fb.includes("10-12"));
  assert.ok(fb.includes("7-9"));
  assert.ok(fb.includes("4-6"));
  assert.ok(!fb.includes("13-15"));
  assert.ok(!fb.includes("16+"));
});

test("harder difficulties blocked for young learners", () => {
  assert.equal(isDifficultyAllowedForAge(5, "moderate"), false);
  assert.equal(isDifficultyAllowedForAge(5, "advanced"), false);
  assert.equal(isDifficultyAllowedForAge(5, "very_easy"), true);
  assert.equal(isDifficultyAllowedForAge(10, "moderate"), true);
  assert.equal(isDifficultyAllowedForAge(10, "advanced"), false);
});

test("validateQuestionForAge rejects long text for ages 4–6", () => {
  const long =
    "This question is intentionally far too long for a very young child and should be rejected by the validator because it exceeds the max character and word limits.";
  const result = validateQuestionForAge(5, {
    text: long,
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    difficulty: "very_easy",
    minAge: 4,
    maxAge: 6,
  });
  assert.equal(result.ok, false);
});

test("validateQuestionForAge accepts a short safe question for age 5", () => {
  const result = validateQuestionForAge(5, {
    text: "What is 1 + 1?",
    options: ["1", "2", "3", "4"],
    correctIndex: 1,
    difficulty: "very_easy",
    minAge: 4,
    maxAge: 6,
  });
  assert.equal(result.ok, true);
});

test("offline flash-cards selector differentiates ages and avoids duplicates", () => {
  for (const age of sampleAges) {
    const band = ageToBand(age);
    for (let i = 0; i < 10; i += 1) {
      const picked = selectQuestions(DEFAULT_QUESTIONS, age, 6);
      assert.ok(picked.length > 0, `age ${age} should get questions`);
      const ids = picked.map((q) => q.id);
      assert.equal(new Set(ids).size, ids.length, "no duplicate ids");
      // Never harder than band (allow softer fallbacks only)
      const order = ["very_easy", "easy", "moderate", "intermediate", "advanced"];
      const maxIdx = order.indexOf(band.difficulty);
      for (const q of picked) {
        const idx = order.indexOf(q.difficulty);
        assert.ok(idx >= 0 && idx <= maxIdx, `age ${age} got ${q.difficulty}`);
      }
    }
  }
});

test("age 5 never receives moderate/intermediate/advanced offline", () => {
  for (let i = 0; i < 20; i += 1) {
    const picked = selectQuestions(DEFAULT_QUESTIONS, 5, 8);
    assert.ok(picked.every((q) => q.difficulty === "very_easy" || q.difficulty === "easy"));
    assert.ok(picked.every((q) => q.difficulty !== "moderate"));
  }
});

test("age 10 never receives advanced offline", () => {
  for (let i = 0; i < 20; i += 1) {
    const picked = selectQuestions(DEFAULT_QUESTIONS, 10, 6);
    assert.ok(picked.every((q) => q.difficulty !== "advanced"));
    assert.ok(picked.every((q) => q.difficulty !== "intermediate"));
  }
});
