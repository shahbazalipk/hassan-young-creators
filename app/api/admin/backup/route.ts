import { NextResponse } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/api";
import { buildAdminBackup } from "@/lib/admin/backup";
import { logActivity } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const limited = await rateLimit(`admin-backup:${auth.user.id}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return jsonError("Too many backup requests. Please wait and try again.", 429, {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  const backup = await buildAdminBackup();
  await logActivity("DATA_EXPORT", "Downloaded admin data backup", auth.user.id, {
    createdAt: backup.createdAt,
  });

  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="hassan-admin-backup-${backup.createdAt.slice(0, 10)}.json"`,
      "X-Backup-Created-At": backup.createdAt,
      "Cache-Control": "no-store",
    },
  });
}
