import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireCsrf } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { filterVisitorChatMessage, getClientIp, hashIp } from "@/lib/security";
import { visitorChatSeenSchema, visitorChatSendSchema } from "@/lib/validation";
import {
  clearVisitorChatAccess,
  getOrCreateVisitorConversation,
  getOwnedVisitorConversation,
  serializeVisitorMessage,
} from "@/lib/visitor-chat";

async function messagingEnabled() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return settings?.visitorMessagingEnabled !== false;
}

export async function GET() {
  if (!(await messagingEnabled())) {
    return jsonOk({
      enabled: false,
      messages: [],
      unreadAdminReplies: 0,
      blocked: false,
      message: "Messages are temporarily unavailable.",
    });
  }

  const conversation = await getOwnedVisitorConversation();
  if (!conversation) {
    return jsonOk({
      enabled: true,
      messages: [],
      unreadAdminReplies: 0,
      blocked: false,
      conversationExists: false,
    });
  }

  const messages = await prisma.visitorChatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  const unreadAdminReplies = messages.filter(
    (m) => m.senderRole === "ADMIN" && !m.visitorReadAt
  ).length;

  return jsonOk({
    enabled: true,
    conversationExists: true,
    blocked: conversation.blocked || conversation.status === "BLOCKED",
    archived: conversation.archived,
    messages: messages.map(serializeVisitorMessage),
    unreadAdminReplies,
  });
}

export async function POST(request: NextRequest) {
  if (!(await messagingEnabled())) {
    return jsonError("Messages are temporarily unavailable.", 403);
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const blocked = await prisma.blockedIp.findUnique({ where: { ipHash } });
  if (blocked) return jsonError("This conversation cannot send more messages.", 403);

  const limit = await rateLimit(`visitor-chat:${ipHash}`, 8, 15 * 60 * 1000);
  if (!limit.ok) {
    return jsonError("Please wait before sending another message.", 429, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = visitorChatSendSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check your message and try again.");

  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  if (parsed.data.website) {
    await prisma.blockedIp
      .create({ data: { ipHash, reason: "Visitor chat honeypot" } })
      .catch(() => undefined);
    return jsonOk({
      message: "Your message was sent to the admin.",
      messages: [],
      unreadAdminReplies: 0,
    });
  }

  const filtered = filterVisitorChatMessage(parsed.data.message);
  if (!filtered.ok) return jsonError(filtered.reason || "Message not allowed.");

  const { conversation } = await getOrCreateVisitorConversation();
  if (conversation.blocked || conversation.status === "BLOCKED") {
    return jsonError("This conversation cannot send more messages.", 403);
  }

  const recent = await prisma.visitorChatMessage.findFirst({
    where: {
      conversationId: conversation.id,
      senderRole: "VISITOR",
    },
    orderBy: { createdAt: "desc" },
  });
  if (
    recent &&
    recent.body === filtered.cleaned &&
    Date.now() - recent.createdAt.getTime() < 20_000
  ) {
    return jsonError("Please wait a moment before sending the same message again.");
  }

  const now = new Date();
  const created = await prisma.visitorChatMessage.create({
    data: {
      conversationId: conversation.id,
      senderRole: "VISITOR",
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
      updatedAt: now,
    },
  });

  const messages = await prisma.visitorChatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk({
    message: "Your message was sent to the admin.",
    created: serializeVisitorMessage(created),
    messages: messages.map(serializeVisitorMessage),
    unreadAdminReplies: messages.filter((m) => m.senderRole === "ADMIN" && !m.visitorReadAt)
      .length,
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = visitorChatSeenSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const conversation = await getOwnedVisitorConversation();
  if (!conversation) return jsonOk({ unreadAdminReplies: 0, messages: [] });

  const now = new Date();
  await prisma.visitorChatMessage.updateMany({
    where: {
      conversationId: conversation.id,
      senderRole: "ADMIN",
      visitorReadAt: null,
    },
    data: { visitorReadAt: now },
  });

  const messages = await prisma.visitorChatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk({
    unreadAdminReplies: 0,
    messages: messages.map(serializeVisitorMessage),
  });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  await clearVisitorChatAccess();
  return jsonOk({
    message: "Conversation access was cleared from this device.",
    messages: [],
    unreadAdminReplies: 0,
  });
}
