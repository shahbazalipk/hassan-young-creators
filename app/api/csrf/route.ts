import { getSession } from "@/lib/auth";
import { createCsrfToken } from "@/lib/csrf";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session.csrfToken) {
    session.csrfToken = createCsrfToken();
    await session.save();
  }
  return jsonOk({ csrfToken: session.csrfToken });
}
