import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  establishUserSession,
  getSession,
  hashPassword,
  isStrongPassword,
  logActivity,
  requireUser,
  sanitizeNextPath,
  verifyPassword,
} from "@/lib/auth";
import { createCsrfToken, verifyCsrfToken } from "@/lib/csrf";
import { jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp, randomToken, sha256 } from "@/lib/security";
import { sendParentEmail } from "@/lib/email";
import { verifyGoogleIdToken } from "@/lib/visitors";
import { AppUserRole } from "@prisma/client";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(10).max(200),
  displayName: z.string().min(2).max(60),
  csrfToken: z.string().min(10),
});

const loginSchema = z.object({
  email: z.string().email().max(200),
  // Accept any non-empty password here; wrong length still maps to a clear message below.
  password: z.string().min(1).max(200),
  csrfToken: z.string().min(10),
  next: z.string().optional(),
});

function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  role: AppUserRole;
  emailVerified: boolean;
}) {
  return {
    id: user.id,
    uid: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    /** Computed server-side from DB role — never accept from client. */
    isAdmin: user.role === AppUserRole.ADMIN,
  };
}

async function authError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  const session = await getSession();
  session.csrfToken = createCsrfToken();
  await session.save();
  return jsonError(message, status, { csrfToken: session.csrfToken, ...extra });
}

async function establishLoggedInSession(user: {
  id: string;
  email: string;
  displayName: string;
  role: AppUserRole;
}) {
  const adminProfile =
    user.role === AppUserRole.ADMIN
      ? await prisma.adminUser.findFirst({ where: { appUserId: user.id } })
      : null;

  const session = await getSession();
  session.csrfToken = createCsrfToken();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.displayName;
  session.isLoggedIn = true;
  session.pending2FA = false;
  session.adminId = adminProfile?.id;
  await session.save();
  return session;
}

export async function GET() {
  const session = await getSession();
  if (!session.csrfToken) {
    session.csrfToken = createCsrfToken();
    await session.save();
  }

  if (!session.isLoggedIn || !session.userId || session.pending2FA) {
    return jsonOk({
      csrfToken: session.csrfToken,
      isLoggedIn: false,
      user: null,
    });
  }

  const user = await prisma.appUser.findUnique({ where: { id: session.userId } });
  if (!user) {
    session.destroy();
    return jsonOk({ csrfToken: createCsrfToken(), isLoggedIn: false, user: null });
  }

  return jsonOk({
    csrfToken: session.csrfToken,
    isLoggedIn: true,
    user: publicUser(user),
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const body = await request.json().catch(() => null);
  const action = String(body?.action || "login");

  if (action === "register") {
    const limit = await rateLimit(`user-register:${hashIp(ip)}`, 8, 60 * 60 * 1000);
    if (!limit.ok) {
      return authError("Too many registration attempts. Please try later.", 429, {
        retryAfterSeconds: limit.retryAfterSeconds,
      });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path?.[0];
      if (field === "email") return authError("Please enter a valid email address.");
      if (field === "password") {
        return authError("Password must be at least 10 characters.");
      }
      if (field === "displayName") {
        return authError("Please enter a name with at least 2 characters.");
      }
      if (field === "csrfToken") {
        return authError("Security check expired. Please refresh the page and try again.", 403);
      }
      return authError("Please check your name, email, and password, then try again.");
    }
    if (!verifyCsrfToken(parsed.data.csrfToken)) {
      return authError("Security check expired. Please refresh the page and try again.", 403);
    }
    if (!isStrongPassword(parsed.data.password)) {
      return authError(
        "Password must be at least 10 characters and include at least one letter and one number."
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const displayName = parsed.data.displayName.trim();
    // Never accept role/isAdmin from client — always USER on signup.
    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      // If they already registered, sign them in with the same password instead of failing.
      if (existing.passwordHash) {
        const valid = await verifyPassword(parsed.data.password, existing.passwordHash);
        if (valid) {
          await prisma.appUser.update({
            where: { id: existing.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
          const session = await establishLoggedInSession(existing);
          return jsonOk({
            message: "Welcome back — this email already had an account, so you are signed in.",
            csrfToken: session.csrfToken,
            user: publicUser(existing),
            next: sanitizeNextPath(body?.next),
            alreadyRegistered: true,
          });
        }
      }
      return authError(
        "This email is already registered. Tap Sign in and use the same email and password.",
        409,
        { alreadyRegistered: true }
      );
    }

    const verifyRaw = randomToken(32);
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    let user;
    try {
      user = await prisma.appUser.create({
        data: {
          email,
          displayName,
          passwordHash: await hashPassword(parsed.data.password),
          role: AppUserRole.USER,
          // Without SMTP, auto-verify so account features work; with SMTP require link click.
          emailVerified: !smtpConfigured,
          verifyTokenHash: smtpConfigured ? sha256(verifyRaw) : null,
          verifyTokenExpiresAt: smtpConfigured
            ? new Date(Date.now() + 48 * 60 * 60 * 1000)
            : null,
        },
      });
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
      if (code === "P2002") {
        return authError(
          "This email is already registered. Tap Sign in and use the same email and password.",
          409,
          { alreadyRegistered: true }
        );
      }
      console.error("register failed", code || err);
      return authError("Could not create the account right now. Please try again.");
    }

    if (smtpConfigured) {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const verifyUrl = `${appUrl}/verify-email?token=${verifyRaw}`;
      await sendParentEmail({
        subject: "Verify your Hassan Creators account",
        text: `Welcome!\n\nPlease verify your email:\n${verifyUrl}\n\nIf you did not create this account, ignore this message.`,
      }).catch(() => null);
    }

    const session = await establishLoggedInSession(user);
    return jsonOk({
      message: "Account created. You are signed in.",
      csrfToken: session.csrfToken,
      user: publicUser(user),
      next: sanitizeNextPath(body?.next),
    });
  }

  if (action === "google") {
    const limit = await rateLimit(`user-google:${hashIp(ip)}`, 20, 15 * 60 * 1000);
    if (!limit.ok) return jsonError("Too many sign-in attempts.", 429);
    if (!verifyCsrfToken(String(body?.csrfToken || ""))) {
      return jsonError("Invalid security token.", 403);
    }
    const profile = await verifyGoogleIdToken(String(body?.googleIdToken || ""));
    if (!profile?.sub) return jsonError("Google sign-in failed.", 401);

    let user = await prisma.appUser.findFirst({
      where: {
        OR: [
          { googleSub: profile.sub },
          ...(profile.email ? [{ email: profile.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!user) {
      user = await prisma.appUser.create({
        data: {
          email: (profile.email || `${profile.sub}@users.noreply.google`).toLowerCase(),
          displayName: profile.name || "Google User",
          googleSub: profile.sub,
          role: AppUserRole.USER,
          emailVerified: Boolean(profile.email_verified),
          passwordHash: null,
        },
      });
    } else {
      user = await prisma.appUser.update({
        where: { id: user.id },
        data: {
          googleSub: profile.sub,
          displayName: profile.name || user.displayName,
          emailVerified: user.emailVerified || Boolean(profile.email_verified),
        },
      });
    }

    // Google users remain USER unless DB role is already ADMIN (seeded).
    const session = await getSession();
    session.csrfToken = createCsrfToken();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.displayName;
    session.isLoggedIn = true;
    session.pending2FA = false;
    session.adminId = undefined;
    await session.save();

    return jsonOk({
      message: "Signed in with Google.",
      csrfToken: session.csrfToken,
      user: publicUser(user),
      next: sanitizeNextPath(body?.next),
    });
  }

  // Default: login
  const limit = await rateLimit(`user-login:${hashIp(ip)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return authError("Too many login attempts. Please try again later.", 429, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path?.[0];
    if (field === "email") return authError("Please enter a valid email address.");
    if (field === "password") return authError("Please enter your password.");
    if (field === "csrfToken") {
      return authError("Security check expired. Please refresh the page and try again.", 403);
    }
    return authError("Please enter a valid email and password.");
  }
  if (!verifyCsrfToken(parsed.data.csrfToken)) {
    return authError("Security check expired. Please refresh the page and try again.", 403);
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.appUser.findUnique({ where: { email } });
  // Generic error — do not reveal whether email exists.
  if (!user || !user.passwordHash) {
    return authError("Email or password is incorrect.", 401);
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return authError("Account temporarily locked after failed attempts. Try again later.", 423);
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    await prisma.appUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= 6 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    return authError("Email or password is incorrect.", 401);
  }

  await prisma.appUser.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const session = await establishLoggedInSession(user);
  if (user.role === AppUserRole.ADMIN) {
    const adminProfile = await prisma.adminUser.findFirst({ where: { appUserId: user.id } });
    if (adminProfile) await logActivity("LOGIN", "Administrator signed in", adminProfile.id);
  }

  return jsonOk({
    message: "Welcome back.",
    csrfToken: session.csrfToken,
    user: publicUser(user),
    next: sanitizeNextPath(parsed.data.next),
  });
}

export async function DELETE() {
  const session = await getSession();
  const userId = session.userId;
  session.destroy();
  if (userId) {
    const admin = await prisma.adminUser.findFirst({ where: { appUserId: userId } });
    if (admin) await logActivity("LOGOUT", "Signed out", admin.id);
  }
  return jsonOk({ message: "Signed out across Hassan’s websites." });
}

export async function PUT(request: NextRequest) {
  // Forgot password
  const ip = getClientIp(request);
  const limit = await rateLimit(`user-reset:${hashIp(ip)}`, 5, 30 * 60 * 1000);
  if (!limit.ok) return jsonError("Too many reset requests. Please wait and try again.", 429);

  const body = await request.json().catch(() => null);
  if (!verifyCsrfToken(String(body?.csrfToken || ""))) {
    return jsonError("Invalid security token.", 403);
  }
  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  const generic = {
    message: "If that email is registered, a reset link will be sent shortly.",
  };
  if (!email) return jsonOk(generic);

  const user = await prisma.appUser.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return jsonOk(generic);

  const rawToken = randomToken(32);
  await prisma.appUser.update({
    where: { id: user.id },
    data: {
      resetTokenHash: sha256(rawToken),
      resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  await sendParentEmail({
    subject: "Password reset — Hassan Creators",
    text: `A password reset was requested.\n\nReset link (valid 1 hour):\n${appUrl}/reset-password?token=${rawToken}\n\nIf you did not request this, ignore this email.`,
  }).catch(() => null);

  return jsonOk(generic);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const action = String(body?.action || "reset");

  if (action === "verify-email") {
    const token = String(body?.token || "");
    if (!token) return jsonError("Invalid verification link.");
    const user = await prisma.appUser.findFirst({
      where: {
        verifyTokenHash: sha256(token),
        verifyTokenExpiresAt: { gt: new Date() },
      },
    });
    if (!user) return jsonError("Verification link is invalid or expired.", 400);
    await prisma.appUser.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyTokenHash: null,
        verifyTokenExpiresAt: null,
      },
    });
    return jsonOk({ message: "Email verified. You can use protected features now." });
  }

  // Password reset complete
  if (!verifyCsrfToken(String(body?.csrfToken || ""))) {
    return jsonError("Invalid security token.", 403);
  }
  const token = String(body?.token || "");
  const password = String(body?.password || "");
  if (!token || !isStrongPassword(password)) {
    return jsonError("Choose a strong password (10+ characters with a letter and a number).");
  }

  const user = await prisma.appUser.findFirst({
    where: {
      resetTokenHash: sha256(token),
      resetTokenExpiresAt: { gt: new Date() },
    },
  });
  if (!user) return jsonError("Reset link is invalid or expired.", 400);

  const passwordHash = await hashPassword(password);
  await prisma.appUser.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Keep AdminUser password in sync if linked
  await prisma.adminUser.updateMany({
    where: { appUserId: user.id },
    data: { passwordHash },
  });

  return jsonOk({ message: "Password updated. You can sign in now." });
}

// silence unused import warning if tree-shaken oddly
void requireUser;
void establishUserSession;
