import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { restoreDefaultWebsiteContent } from "@/lib/admin/default-content";
import { logActivity } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  const limited = await rateLimit(`admin-restore-defaults:${auth.user.id}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return jsonError("Too many restore requests. Please wait and try again.", 429, {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  try {
    const created = await prisma.$transaction(async (tx) => restoreDefaultWebsiteContent(tx));
    const createdCount = Object.values(created).reduce((sum, n) => sum + n, 0);

    await logActivity(
      "SETTINGS_UPDATE",
      "Restored default website content",
      auth.user.id,
      { created, createdCount }
    );

    revalidatePath("/");
    revalidatePath("/admin");

    return jsonOk({
      message:
        createdCount > 0
          ? "Default website content restored. Missing sections were recreated without duplicates."
          : "Default website content is already complete. No duplicates were created.",
      created,
      createdCount,
    });
  } catch {
    return jsonError("Could not restore default website content.", 500);
  }
}
