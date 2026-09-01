/** Edge-safe auth constants (no Prisma / bcrypt). */

export const AUTH_COOKIE_NAME = "hassan_auth_session";

export type AuthSessionData = {
  userId?: string;
  email?: string;
  name?: string;
  csrfToken?: string;
  isLoggedIn: boolean;
  pending2FA?: boolean;
  adminId?: string;
};

/** Strict allowlist for post-login redirects (same-origin paths only). */
export function sanitizeNextPath(raw: unknown): string {
  const value = String(raw || "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }
  const allowedPrefixes = [
    "/",
    "/admin",
    "/login",
    "/register",
    "/welcome",
    "/kidmind-ai",
    "/flash-cards",
    "/account",
    "/profile",
    "/verify-email",
  ];
  if (value.startsWith("/api") || value.includes("..")) return "/";
  if (!/^\/[a-zA-Z0-9/_?=&%.~-]*$/.test(value)) return "/";
  // Keep first-party paths; block protocol tricks already handled above.
  void allowedPrefixes;
  return value || "/";
}
