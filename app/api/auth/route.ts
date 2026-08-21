import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  createDbSession,
  getSession,
  hashPassword,
  logActivity,
  verifyPassword,
} from "@/lib/auth";
import { createCsrfToken, verifyCsrfToken } from "@/lib/csrf";
import { jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp, randomToken, sha256 } from "@/lib/security";
import { loginSchema } from "@/lib/validation";
import { sendParentEmail } from "@/lib/email";
import { AppUserRole } from "@prisma/client";
import * as OTPAuth from "otpauth";

/**
 * Admin login — verifies against AppUser with role ADMIN (and linked AdminUser for 2FA).
 * Never trusts client-supplied role fields.
 */
export async function GET() {
  const session = await getSession();
  if (!session.csrfToken) {
    session.csrfToken = createCsrfToken();
    await session.save();
  }

  let isAdmin = false;
  let name: string | null = session.name || null;
  if (session.isLoggedIn && session.userId && !session.pending2FA) {
    const user = await prisma.appUser.findUnique({ where: { id: session.userId } });
    isAdmin = user?.role === AppUserRole.ADMIN;
    name = user?.displayName || name;
  }

  return jsonOk({
    csrfToken: session.csrfToken,
    isLoggedIn: Boolean(session.isLoggedIn && session.userId && !session.pending2FA && isAdmin),
    pending2FA: Boolean(session.pending2FA),
    name,
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`login:${hashIp(ip)}`, 8, 15 * 60 * 1000);
  if (!limit.ok) {
    return jsonError("Too many login attempts. Please try again later.", 429, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid login details.");

  if (!verifyCsrfToken(parsed.data.csrfToken)) {
    return jsonError("Invalid security token. Please refresh and try again.", 403);
  }

  const email = parsed.data.email.toLowerCase();
  const appUser = await prisma.appUser.findUnique({
    where: { email },
    include: { adminProfile: true },
  });

  // Generic failure — do not reveal admin existence.
  if (!appUser || appUser.role !== AppUserRole.ADMIN || !appUser.passwordHash) {
    return jsonError("Email or password is incorrect.", 401);
  }

  if (appUser.lockedUntil && appUser.lockedUntil > new Date()) {
    return jsonError("Account temporarily locked after failed attempts. Try again later.", 423);
  }

  const valid = await verifyPassword(parsed.data.password, appUser.passwordHash);
  if (!valid) {
    const attempts = appUser.failedLoginAttempts + 1;
    const lockedUntil = attempts >= 6 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    await prisma.appUser.update({
      where: { id: appUser.id },
      data: { failedLoginAttempts: attempts, lockedUntil },
    });
    return jsonError("Email or password is incorrect.", 401);
  }

  let adminProfile = appUser.adminProfile;
  if (!adminProfile) {
    // Ensure AdminUser row exists for TOTP / activity log compatibility
    adminProfile = await prisma.adminUser.create({
      data: {
        email: appUser.email,
        passwordHash: appUser.passwordHash,
        name: appUser.displayName,
        role: "PARENT_ADMIN",
        appUserId: appUser.id,
      },
    });
  }

  if (adminProfile.totpEnabled && adminProfile.totpSecret) {
    const totp = new OTPAuth.TOTP({
      issuer: "HassanPortfolio",
      label: adminProfile.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(adminProfile.totpSecret),
    });
    const code = parsed.data.totpCode || "";
    if (!code || totp.validate({ token: code, window: 1 }) === null) {
      const session = await getSession();
      session.userId = appUser.id;
      session.adminId = adminProfile.id;
      session.email = appUser.email;
      session.name = appUser.displayName;
      session.pending2FA = true;
      session.isLoggedIn = false;
      session.csrfToken = createCsrfToken();
      await session.save();
      return jsonOk({ requires2FA: true, csrfToken: session.csrfToken });
    }
  }

  await prisma.appUser.update({
    where: { id: appUser.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  await prisma.adminUser.update({
    where: { id: adminProfile.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, passwordHash: appUser.passwordHash },
  });

  await createDbSession(adminProfile.id, request);
  const session = await getSession();
  session.userId = appUser.id;
  session.adminId = adminProfile.id;
  session.email = appUser.email;
  session.name = appUser.displayName;
  session.isLoggedIn = true;
  session.pending2FA = false;
  session.csrfToken = createCsrfToken();
  await session.save();

  await logActivity("LOGIN", "Parent/guardian signed in", adminProfile.id);
  return jsonOk({ message: "Welcome back.", csrfToken: session.csrfToken });
}

export async function DELETE() {
  const session = await getSession();
  const adminId = session.adminId;
  session.destroy();
  if (adminId) await logActivity("LOGOUT", "Parent/guardian signed out", adminId);
  return jsonOk({ message: "Signed out." });
}

export async function PUT(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`reset:${hashIp(ip)}`, 5, 30 * 60 * 1000);
  if (!limit.ok) return jsonError("Too many reset requests. Please wait and try again.", 429);

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  const csrfToken = String(body?.csrfToken || "");
  if (!verifyCsrfToken(csrfToken)) return jsonError("Invalid security token.", 403);
  if (!email) return jsonError("Please enter the parent email.");

  const appUser = await prisma.appUser.findUnique({ where: { email } });
  const generic = {
    message:
      "If that email is registered, a reset link will be sent shortly. Check the parent inbox.",
  };

  if (!appUser || appUser.role !== AppUserRole.ADMIN) return jsonOk(generic);

  const rawToken = randomToken(32);
  await prisma.appUser.update({
    where: { id: appUser.id },
    data: {
      resetTokenHash: sha256(rawToken),
      resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/admin/reset-password?token=${rawToken}`;
  await sendParentEmail({
    subject: "Hassan portfolio password reset",
    text: `A password reset was requested for the Hassan portfolio admin.\n\nReset link (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
  });

  return jsonOk(generic);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = String(body?.token || "");
  const password = String(body?.password || "");
  const csrfToken = String(body?.csrfToken || "");
  if (!verifyCsrfToken(csrfToken)) return jsonError("Invalid security token.", 403);
  if (!token || password.length < 12) {
    return jsonError("Choose a strong password with at least 12 characters.");
  }

  const appUser = await prisma.appUser.findFirst({
    where: {
      resetTokenHash: sha256(token),
      resetTokenExpiresAt: { gt: new Date() },
      role: AppUserRole.ADMIN,
    },
  });
  if (!appUser) return jsonError("Reset link is invalid or expired.", 400);

  const passwordHash = await hashPassword(password);
  await prisma.appUser.update({
    where: { id: appUser.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  await prisma.adminUser.updateMany({
    where: { appUserId: appUser.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await logActivity("SETTINGS_UPDATE", "Password was reset for parent/guardian", undefined, {
    appUserId: appUser.id,
  });
  return jsonOk({ message: "Password updated. You can sign in now." });
}
