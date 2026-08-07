import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { runScopedDelete } from "@/lib/admin/delete-data";
import { isDeleteScope, SCOPE_LABELS } from "@/lib/admin/scopes";
import { logActivity } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;
  if (body?.confirm !== true) return jsonError("Deletion requires confirmation.");

  const scope = String(body?.scope || "");
  if (!isDeleteScope(scope)) return jsonError("Invalid deletion scope.");

  const limited = await rateLimit(`admin-delete-scope:${auth.user.id}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    return jsonError("Too many destructive requests. Please wait and try again.", 429, {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  try {
    const counts = await runScopedDelete(scope);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    await logActivity(
      "DELETE_SCOPE",
      `Deleted all ${SCOPE_LABELS[scope].toLowerCase()} (${total} records)`,
      auth.user.id,
      { scope, counts }
    );
    return jsonOk({
      message: `Deleted all ${SCOPE_LABELS[scope].toLowerCase()}.`,
      counts,
      deletedCount: total,
    });
  } catch {
    return jsonError("Scoped deletion failed and was rolled back.", 500);
  }
}
