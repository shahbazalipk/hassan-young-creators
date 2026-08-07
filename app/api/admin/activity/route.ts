import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;
  if (body?.confirm !== true) return jsonError("Deletion requires confirmation.");

  const limited = await rateLimit(`admin-delete-activity:${auth.user.id}`, 40, 15 * 60 * 1000);
  if (!limited.ok) {
    return jsonError("Too many destructive requests. Please wait and try again.", 429, {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  const id = String(body?.id || "");
  if (!id) return jsonError("Missing activity id.");

  const existing = await prisma.activityLog.findUnique({ where: { id } });
  if (!existing) return jsonError("Activity record not found.", 404);

  await prisma.activityLog.delete({ where: { id } });
  await logActivity("DELETE_SCOPE", "Deleted one activity record", auth.user.id, {
    deletedActivityId: id,
    deletedType: existing.type,
  });

  return jsonOk({ message: "Activity record deleted." });
}
