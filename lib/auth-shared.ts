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
  if (value.startsWith("/api") || value.includes("..")) return "/";
  if (!/^\/[a-zA-Z0-9/_?=&%.~-]*$/.test(value)) return "/";
  return value || "/";
}
