import { jsonOk, requireAdminApi } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const unreadCount = await prisma.contactMessage.count({
    where: { status: "UNREAD" },
  });

  return jsonOk({ unreadCount });
}
