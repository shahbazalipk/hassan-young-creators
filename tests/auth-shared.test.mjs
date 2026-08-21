/**
 * Auth redirect allowlist tests (mirrors lib/auth-shared.ts).
 * Run: node --test tests/auth-shared.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";

const AUTH_COOKIE_NAME = "hassan_auth_session";

function sanitizeNextPath(raw) {
  const value = String(raw || "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }
  if (value.startsWith("/api") || value.includes("..")) return "/";
  if (!/^\/[a-zA-Z0-9/_?=&%.~-]*$/.test(value)) return "/";
  return value || "/";
}

test("auth cookie name is shared across path apps", () => {
  assert.equal(AUTH_COOKIE_NAME, "hassan_auth_session");
});

test("sanitizeNextPath rejects external and dangerous redirects", () => {
  assert.equal(sanitizeNextPath("https://evil.com"), "/");
  assert.equal(sanitizeNextPath("//evil.com"), "/");
  assert.equal(sanitizeNextPath("/api/admin/visitors"), "/");
  assert.equal(sanitizeNextPath("/../etc/passwd"), "/");
  assert.equal(sanitizeNextPath("/flash-cards"), "/flash-cards");
  assert.equal(sanitizeNextPath("/kidmind-ai"), "/kidmind-ai");
  assert.equal(sanitizeNextPath("/admin"), "/admin");
});
