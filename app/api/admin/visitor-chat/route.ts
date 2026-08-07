import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { filterVisitorChatMessage } from "@/lib/security";
import { logActivity } from "@/lib/auth";
import { serializeVisitorMessage } from "@/lib/visitor-chat";
import { z } from "zod";

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const conversations = await prisma.visitorConversation.findMany({
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const mapped = conversations.map((c) => {
    const unreadCount = c.messages.filter((m) => m.senderRole === "VISITOR" && !m.readAt).length;
    const latest = c.messages[0];
    return {
      id: c.publicId,
      status: c.status,
      archived: c.archived,
      blocked: c.blocked,
      flagged: c.flagged,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      lastMessageAt: c.lastMessageAt?.toISOString() || null,
      unreadCount,
      preview: latest?.body?.slice(0, 120) || "No messages yet",
      previewRole: latest?.senderRole === "ADMIN" ? "admin" : "visitor",
    };
  });

  const unreadConversations = mapped.filter((c) => c.unreadCount > 0).length;
  const unreadMessages = mapped.reduce((sum, c) => sum + c.unreadCount, 0);

  return jsonOk({
    unreadConversations,
    unreadMessages,
    conversations: mapped,
  });
}

const replySchema = z.object({
  conversationId: z.string().min(8),
  message: z.string().min(1).max(1000),
  csrfToken: z.string().min(10),
});

const actionSchema = z.object({
  conversationId: z.string().min(8),
  action: z.enum(["archive", "unarchive", "block", "unblock", "mark-read", "mark-unread"]),
  csrfToken: z.string().min(10),
});

const deleteSchema = z
  .object({
    conversationId: z.string().min(8).optional(),
    messageId: z.string().min(8).optional(),
    confirm: z.literal(true),
    csrfToken: z.string().min(10),
  })
  .refine((data) => Boolean(data.conversationId || data.messageId), {
    message: "conversationId or messageId required",
  });

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check your reply.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const conversation = await prisma.visitorConversation.findUnique({
    where: { publicId: parsed.data.conversationId },
  });
  if (!conversation) return jsonError("Conversation not found.", 404);
  if (conversation.blocked) return jsonError("This conversation is blocked.");

  const filtered = filterVisitorChatMessage(parsed.data.message);
  if (!filtered.ok) return jsonError(filtered.reason || "Reply not allowed.");

  const now = new Date();
  // Opening/replying marks visitor messages as read.
  await prisma.visitorChatMessage.updateMany({
    where: {
      conversationId: conversation.id,
      senderRole: "VISITOR",
      readAt: null,
    },
    data: { readAt: now, status: "READ" },
  });

  const created = await prisma.visitorChatMessage.create({
    data: {
      conversationId: conversation.id,
      senderRole: "ADMIN",
      body: filtered.cleaned,
      status: "DELIVERED",
      deliveredAt: now,
    },
  });

  await prisma.visitorConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: now,
      archived: false,
      status: "ACTIVE",
    },
  });

  await logActivity("VISITOR_CHAT_REPLY", "Replied to a visitor conversation", auth.user.id, {
    conversationId: conversation.publicId,
  });

  const messages = await prisma.visitorChatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk({
    message: "Reply sent.",
    created: serializeVisitorMessage(created),
    messages: messages.map(serializeVisitorMessage),
  });
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid action.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const conversation = await prisma.visitorConversation.findUnique({
    where: { publicId: parsed.data.conversationId },
  });
  if (!conversation) return jsonError("Conversation not found.", 404);

  const now = new Date();
  if (parsed.data.action === "archive") {
    await prisma.visitorConversation.update({
      where: { id: conversation.id },
      data: { archived: true, status: "ARCHIVED" },
    });
  } else if (parsed.data.action === "unarchive") {
    await prisma.visitorConversation.update({
      where: { id: conversation.id },
      data: { archived: false, status: "ACTIVE" },
    });
  } else if (parsed.data.action === "block") {
    await prisma.visitorConversation.update({
      where: { id: conversation.id },
      data: { blocked: true, status: "BLOCKED" },
    });
    await logActivity("VISITOR_CHAT_BLOCK", "Blocked a visitor conversation", auth.user.id, {
      conversationId: conversation.publicId,
    });
  } else if (parsed.data.action === "unblock") {
    await prisma.visitorConversation.update({
      where: { id: conversation.id },
      data: { blocked: false, status: "ACTIVE" },
    });
  } else if (parsed.data.action === "mark-read") {
    await prisma.visitorChatMessage.updateMany({
      where: {
        conversationId: conversation.id,
        senderRole: "VISITOR",
        readAt: null,
      },
      data: { readAt: now, status: "READ" },
    });
  } else if (parsed.data.action === "mark-unread") {
    await prisma.visitorChatMessage.updateMany({
      where: {
        conversationId: conversation.id,
        senderRole: "VISITOR",
      },
      data: { readAt: null, status: "DELIVERED" },
    });
  }

  return jsonOk({ message: "Conversation updated." });
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Confirmation required.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  if (parsed.data.messageId) {
    const message = await prisma.visitorChatMessage.findFirst({
      where: {
        OR: [{ id: parsed.data.messageId }, { publicId: parsed.data.messageId }],
      },
    });
    if (!message) return jsonError("Message not found.", 404);
    await prisma.visitorChatMessage.delete({ where: { id: message.id } });
    await logActivity("VISITOR_CHAT_DELETE", "Deleted a visitor chat message", auth.user.id, {
      messageId: message.publicId,
    });
    return jsonOk({ message: "Message deleted." });
  }

  const conversation = await prisma.visitorConversation.findUnique({
    where: { publicId: parsed.data.conversationId },
  });
  if (!conversation) return jsonError("Conversation not found.", 404);

  await prisma.visitorConversation.delete({ where: { id: conversation.id } });
  await logActivity("VISITOR_CHAT_DELETE", "Deleted a visitor conversation", auth.user.id, {
    conversationId: conversation.publicId,
  });
  return jsonOk({ message: "Conversation deleted." });
}
