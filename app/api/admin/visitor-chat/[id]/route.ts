import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { serializeVisitorMessage } from "@/lib/visitor-chat";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const { id } = await params;

  const conversation = await prisma.visitorConversation.findUnique({
    where: { publicId: id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) return jsonError("Conversation not found.", 404);

  const now = new Date();
  await prisma.visitorChatMessage.updateMany({
    where: {
      conversationId: conversation.id,
      senderRole: "VISITOR",
      readAt: null,
    },
    data: { readAt: now, status: "READ" },
  });

  const messages = await prisma.visitorChatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk({
    conversation: {
      id: conversation.publicId,
      status: conversation.status,
      archived: conversation.archived,
      blocked: conversation.blocked,
      flagged: conversation.flagged,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
    },
    messages: messages.map(serializeVisitorMessage),
  });
}
