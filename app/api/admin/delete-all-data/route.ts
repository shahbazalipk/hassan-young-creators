import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { runGlobalDelete } from "@/lib/admin/delete-data";
import { logActivity } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;
  if (body?.confirm !== true) return jsonError("Deletion requires confirmation.");

  const limited = await rateLimit(`admin-delete-all:${auth.user.id}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return jsonError("Too many global deletion attempts. Please wait and try again.", 429, {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  try {
    const counts = await runGlobalDelete();
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

    // Safe audit event after wipe — does not store deleted private content.
    await logActivity(
      "DELETE_ALL_DATA",
      "Permanently deleted all admin-managed website content",
      auth.user.id,
      { deletedRecordGroups: Object.keys(counts), deletedCount: total }
    );

    return jsonOk({
      message:
        "Removable Admin Panel data was deleted. Essential public website content was preserved.",
      counts,
      deletedCount: total,
    });
  } catch {
    return jsonError("Global deletion failed and was rolled back.", 500);
  }
}
