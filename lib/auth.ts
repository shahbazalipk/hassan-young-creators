import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashIp, randomToken, sha256 } from "@/lib/security";
import { ActivityType } from "@prisma/client";

export type SessionData = {
  adminId?: string;
  email?: string;
  name?: string;
  role?: "PARENT_ADMIN";
  csrfToken?: string;
  isLoggedIn: boolean;
  pending2FA?: boolean;
};

const SESSION_TTL_SECONDS = 60 * 60 * 8;

export function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  return {
    cookieName: "hassan_admin_session",
    password,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.adminId || session.pending2FA) {
    return null;
  }
  const user = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
  if (!user) return null;
  return { session, user };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function logActivity(
  type: ActivityType,
  summary: string,
  userId?: string | null,
  meta: Record<string, unknown> = {}
) {
  await prisma.activityLog.create({
    data: {
      type,
      summary,
      userId: userId || null,
      metaJson: JSON.stringify(meta),
    },
  });
}

export async function createDbSession(userId: string, request: Request) {
  const raw = randomToken(48);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.session.create({
    data: {
      userId,
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
