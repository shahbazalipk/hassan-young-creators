/**
 * Update legacy flash-cards age tests for new bands.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { selectQuestions, ageToBand } from "../public/flash-cards/js/questions.js";

const bank = [
  { id: "e1", text: "easy1", options: ["a", "b", "c", "d"], correct: 0, difficulty: "very_easy", minAge: 4, maxAge: 6 },
  { id: "e2", text: "easy2", options: ["a", "b", "c", "d"], correct: 0, difficulty: "very_easy", minAge: 4, maxAge: 6 },
  { id: "ea1", text: "band7", options: ["a", "b", "c", "d"], correct: 0, difficulty: "easy", minAge: 7, maxAge: 9 },
  { id: "ea2", text: "band8", options: ["a", "b", "c", "d"], correct: 0, difficulty: "easy", minAge: 7, maxAge: 9 },
  { id: "m1", text: "med1", options: ["a", "b", "c", "d"], correct: 0, difficulty: "moderate", minAge: 10, maxAge: 12 },
  { id: "m2", text: "med2", options: ["a", "b", "c", "d"], correct: 0, difficulty: "moderate", minAge: 10, maxAge: 12 },
  { id: "h1", text: "hard1", options: ["a", "b", "c", "d"], correct: 0, difficulty: "intermediate", minAge: 13, maxAge: 15 },
  { id: "h2", text: "hard2", options: ["a", "b", "c", "d"], correct: 0, difficulty: "intermediate", minAge: 13, maxAge: 15 },
];

test("age 10 maps to 10-12 band", () => {
  assert.equal(ageToBand(10).id, "10-12");
});

test("age 10 never receives intermediate/advanced questions", () => {
  for (let i = 0; i < 20; i += 1) {
    const picked = selectQuestions(bank, 10, 4);
    assert.ok(picked.every((q) => q.difficulty !== "intermediate" && q.difficulty !== "advanced"));
    const ids = picked.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, "no duplicates in one session");
  }
});

test("age 6 only receives very_easy (or softer equal) questions", () => {
  for (let i = 0; i < 20; i += 1) {
    const picked = selectQuestions(bank, 6, 2);
    assert.ok(picked.every((q) => q.difficulty === "very_easy"));
  }
});

test("age 7 receives easy-band questions, not moderate", () => {
  for (let i = 0; i < 20; i += 1) {
    const picked = selectQuestions(bank, 7, 2);
    assert.ok(picked.every((q) => q.difficulty === "easy" || q.difficulty === "very_easy"));
    assert.ok(picked.every((q) => q.difficulty !== "moderate"));
  }
});
