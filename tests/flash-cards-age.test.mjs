/**
 * Lightweight Node tests for Flash Cards age-safe question selection.
 * Run: node --experimental-vm-modules --test tests/flash-cards-age.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { selectQuestions, ageToBand } from "../public/flash-cards/js/questions.js";

const bank = [
  { id: "e1", text: "easy1", options: ["a", "b", "c", "d"], correct: 0, difficulty: "easy" },
  { id: "e2", text: "easy2", options: ["a", "b", "c", "d"], correct: 0, difficulty: "easy" },
  { id: "m1", text: "med1", options: ["a", "b", "c", "d"], correct: 0, difficulty: "medium" },
  { id: "m2", text: "med2", options: ["a", "b", "c", "d"], correct: 0, difficulty: "medium" },
  { id: "h1", text: "hard1", options: ["a", "b", "c", "d"], correct: 0, difficulty: "hard" },
  { id: "h2", text: "hard2", options: ["a", "b", "c", "d"], correct: 0, difficulty: "hard" },
];

test("age 10 maps to 8-10 band", () => {
  assert.equal(ageToBand(10).id, "8-10");
});

test("age 10 never receives hard questions", () => {
  for (let i = 0; i < 20; i += 1) {
    const picked = selectQuestions(bank, 10, 4);
    assert.ok(picked.every((q) => q.difficulty !== "hard"));
    const ids = picked.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, "no duplicates in one session");
  }
});

test("age 6 only receives easy questions", () => {
  for (let i = 0; i < 20; i += 1) {
    const picked = selectQuestions(bank, 6, 2);
    assert.ok(picked.every((q) => q.difficulty === "easy"));
  }
});
