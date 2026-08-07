import { prisma } from "@/lib/db";
import { jsonOk, requireAdminApi } from "@/lib/api";

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const unreadCount = await prisma.visitorChatMessage.count({
    where: {
      senderRole: "VISITOR",
      readAt: null,
      conversation: {
        blocked: false,
        archived: false,
      },
    },
  });

  return jsonOk({ unreadCount });
}
