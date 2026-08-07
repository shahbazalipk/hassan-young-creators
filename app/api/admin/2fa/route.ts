import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import * as OTPAuth from "otpauth";

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "HassanPortfolio",
    label: auth.user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  await prisma.adminUser.update({
    where: { id: auth.user.id },
    data: { totpSecret: secret.base32, totpEnabled: false },
  });

  return jsonOk({
    secret: secret.base32,
    otpauthUrl: totp.toString(),
    message: "Scan this with an authenticator app, then confirm with a 6-digit code.",
  });
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  const code = String(body?.totpCode || "");
  const user = await prisma.adminUser.findUnique({ where: { id: auth.user.id } });
  if (!user?.totpSecret) return jsonError("Start 2FA setup first.");

  const totp = new OTPAuth.TOTP({
    issuer: "HassanPortfolio",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.totpSecret),
  });

  if (totp.validate({ token: code, window: 1 }) === null) {
    return jsonError("That code was not valid. Try again.");
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });
  await logActivity("SETTINGS_UPDATE", "Enabled two-factor authentication", user.id);
  return jsonOk({ message: "Two-factor authentication is now enabled." });
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  await prisma.adminUser.update({
    where: { id: auth.user.id },
    data: { totpEnabled: false, totpSecret: null },
  });
  await logActivity("SETTINGS_UPDATE", "Disabled two-factor authentication", auth.user.id);
  return jsonOk({ message: "Two-factor authentication disabled." });
}
