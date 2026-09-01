import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashIp, randomToken, sha256 } from "@/lib/security";
import { ActivityType, AppUser, AppUserRole, AdminUser } from "@prisma/client";
import { AUTH_COOKIE_NAME } from "@/lib/auth-shared";

export { AUTH_COOKIE_NAME, sanitizeNextPath } from "@/lib/auth-shared";

/** @deprecated Prefer AUTH_COOKIE_NAME; kept briefly for migration reads. */
export const LEGACY_ADMIN_COOKIE_NAME = "hassan_admin_session";

export type AuthSessionData = {
  userId?: string;
  email?: string;
  name?: string;
  csrfToken?: string;
  isLoggedIn: boolean;
  pending2FA?: boolean;
  /** Never trust this alone for authorization — always re-check DB role. */
  adminId?: string;
  /** Must match AppUser.sessionVersion or the session is rejected. */
  sessionVersion?: number;
};

/** @deprecated alias */
export type SessionData = AuthSessionData;

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — persistent shared login across visits

export function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  return {
    cookieName: AUTH_COOKIE_NAME,
    password,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Rolling cookies: maxAge refreshed whenever session.save() runs.
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<AuthSessionData>(cookieStore, getSessionOptions());
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isStrongPassword(password: string): boolean {
  if (password.length < 10 || password.length > 200) return false;
  // At least one letter and one number
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}

/**
 * Server-side admin gate. Role is always loaded from the database (AppUser.role).
 * Returns the linked AdminUser as `user` so existing admin APIs keep working.
 * Frontend role/name/email tricks cannot pass this check.
 */
export async function requireAdmin(): Promise<{
  session: AuthSessionData & { save: () => Promise<void> };
  user: AdminUser;
  appUser: AppUser;
} | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || session.pending2FA) {
    return null;
  }

  const appUser = await prisma.appUser.findUnique({
    where: { id: session.userId },
    include: { adminProfile: true },
  });
  if (!appUser || appUser.role !== AppUserRole.ADMIN) {
    return null;
  }

  let adminProfile = appUser.adminProfile;
  if (!adminProfile) {
    adminProfile = await prisma.adminUser.create({
      data: {
        email: appUser.email,
        passwordHash: appUser.passwordHash || (await hashPassword(randomToken(24))),
        name: appUser.displayName,
        role: "PARENT_ADMIN",
        appUserId: appUser.id,
      },
    });
  }

  return {
    session: session as AuthSessionData & { save: () => Promise<void> },
    user: adminProfile,
    appUser,
  };
}

/** Any authenticated AppUser (regular or admin). */
export async function requireUser(): Promise<{
  session: AuthSessionData & { save: () => Promise<void> };
  user: AppUser;
} | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || session.pending2FA) {
    return null;
  }
  const user = await prisma.appUser.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  if (
    typeof session.sessionVersion === "number" &&
    session.sessionVersion !== user.sessionVersion
  ) {
    session.destroy();
    return null;
  }
  return { session: session as AuthSessionData & { save: () => Promise<void> }, user };
}

export async function logActivity(
  type: ActivityType,
  summary: string,
  userId?: string | null,
  meta: Record<string, unknown> = {}
) {
  // ActivityLog.userId still references AdminUser — resolve via AppUser link when possible.
  let adminUserId: string | null = null;
  if (userId) {
    const linked = await prisma.adminUser.findFirst({
      where: { OR: [{ id: userId }, { appUserId: userId }] },
      select: { id: true },
    });
    adminUserId = linked?.id || null;
  }
  await prisma.activityLog.create({
    data: {
      type,
      summary,
      userId: adminUserId,
      metaJson: JSON.stringify(meta),
    },
  });
}

export async function createDbSession(adminUserId: string, request: Request) {
  const raw = randomToken(48);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.session.create({
    data: {
      userId: adminUserId,
      tokenHash,
      expiresAt,
      ipHash: hashIp(request.headers.get("x-forwarded-for")),
      userAgent: request.headers.get("user-agent")?.slice(0, 200) || null,
    },
  });
  return raw;
}

export function parentEmailFromEnv(): string {
  return (process.env.PARENT_CONTACT_EMAIL || "").trim().toLowerCase();
}

export async function establishUserSession(user: AppUser, options?: { pending2FA?: boolean; adminId?: string }) {
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.displayName;
  session.adminId = options?.adminId;
  session.pending2FA = Boolean(options?.pending2FA);
  session.isLoggedIn = !options?.pending2FA;
  session.sessionVersion = user.sessionVersion ?? 0;
  session.csrfToken = session.csrfToken || undefined;
  await session.save();
  return session;
}
