/**
 * Shared auth cookie / logout sync unit checks.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { AUTH_COOKIE_NAME, sanitizeNextPath } from "../lib/auth-shared.ts";

test("shared auth cookie name is hassan_auth_session", () => {
  assert.equal(AUTH_COOKIE_NAME, "hassan_auth_session");
});

test("sanitizeNextPath allows KidMind and Flash Cards return paths", () => {
  assert.equal(sanitizeNextPath("/kidmind-ai"), "/kidmind-ai");
  assert.equal(sanitizeNextPath("/flash-cards"), "/flash-cards");
  assert.equal(sanitizeNextPath("https://evil.example"), "/");
  assert.equal(sanitizeNextPath("//evil.example"), "/");
});
