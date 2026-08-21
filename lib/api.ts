import { NextResponse } from "next/server";
import { verifyCsrfToken } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";

export function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export async function requireAdminApi() {
  const auth = await requireAdmin();
  if (!auth) return { auth: null, response: jsonError("Access denied", 403) };
  return { auth, response: null };
}

export function requireCsrf(token: string | null | undefined) {
  if (!verifyCsrfToken(token)) {
    return jsonError("Invalid security token. Please refresh and try again.", 403);
  }
  return null;
}
