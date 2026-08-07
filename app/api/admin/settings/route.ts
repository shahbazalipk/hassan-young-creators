import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation";

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return jsonOk({
    settings: {
      ...settings,
      // Never return env parent email unless intentionally shown; admin can edit display flag only.
      parentContactEmailConfigured: Boolean(process.env.PARENT_CONTACT_EMAIL),
      parentContactEmailHint: process.env.PARENT_CONTACT_EMAIL
        ? maskEmail(process.env.PARENT_CONTACT_EMAIL)
        : "Not set in environment",
    },
  });
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check the settings fields.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const { csrfToken: _csrf, ...data } = parsed.data;
  const settings = await prisma.siteSettings.update({
    where: { id: 1 },
    data: {
      ...data,
      // Public contact form and inspiration submissions are permanently disabled.
      contactFormEnabled: false,
      guestbookEnabled: false,
    },
  });

  await logActivity("SETTINGS_UPDATE", "Updated website settings", auth.user.id);
  return jsonOk({ settings });
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "configured";
  return `${user.slice(0, 2)}***@${domain}`;
}
