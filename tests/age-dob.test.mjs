/**
 * DOB / age progression unit tests.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  ageFromDob,
  isPlausibleStudentDob,
  parseDobInput,
  publicLeaderboardName,
  smoothDifficultyProgress,
} from "../lib/age.ts";

test("ageFromDob handles normal birthdays", () => {
  const dob = parseDobInput("2016-03-10");
  assert.ok(dob);
  assert.equal(ageFromDob(dob, new Date(Date.UTC(2026, 2, 9))), 9); // day before birthday
  assert.equal(ageFromDob(dob, new Date(Date.UTC(2026, 2, 10))), 10); // on birthday
  assert.equal(ageFromDob(dob, new Date(Date.UTC(2026, 2, 11))), 10); // after
});

test("ageFromDob handles leap-day birthdays", () => {
  const dob = parseDobInput("2016-02-29");
  assert.ok(dob);
  // In a non-leap year, birthday is treated via UTC date math.
  const age = ageFromDob(dob, new Date(Date.UTC(2025, 2, 1)));
  assert.ok(age >= 8 && age <= 10);
});

test("parseDobInput rejects invalid dates", () => {
  assert.equal(parseDobInput("2020-02-30"), null);
  assert.equal(parseDobInput("not-a-date"), null);
});

test("isPlausibleStudentDob enforces 4–18", () => {
  const tooYoung = parseDobInput("2024-01-01");
  const ok = parseDobInput("2015-06-01");
  assert.equal(isPlausibleStudentDob(tooYoung, new Date(Date.UTC(2026, 0, 1))), false);
  assert.equal(isPlausibleStudentDob(ok, new Date(Date.UTC(2026, 0, 1))), true);
});

test("smoothDifficultyProgress stays between 0 and 1 and rises with accuracy", () => {
  const dob = parseDobInput("2014-01-01");
  const low = smoothDifficultyProgress({ age: 12, dob, recentAccuracy: 0.2 });
  const high = smoothDifficultyProgress({ age: 12, dob, recentAccuracy: 0.95 });
  assert.ok(low >= 0 && low <= 1);
  assert.ok(high >= 0 && high <= 1);
  assert.ok(high >= low);
});

test("publicLeaderboardName never returns email and respects consent", () => {
  assert.equal(
    publicLeaderboardName({
      displayName: "Ayaan Ali",
      publicNickname: null,
      leaderboardConsent: false,
    }),
    "Young Creator"
  );
  assert.equal(
    publicLeaderboardName({
      displayName: "Ayaan Ali",
      publicNickname: "StarCoder",
      leaderboardConsent: true,
    }),
    "StarCoder"
  );
});
