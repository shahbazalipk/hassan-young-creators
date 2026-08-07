import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/security";

export type VisitorChatSession = {
  visitorToken?: string;
};

const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 365;

export function getVisitorChatSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  return {
    cookieName: "hassan_visitor_chat",
    password,
    ttl: VISITOR_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getVisitorChatSession() {
  const cookieStore = await cookies();
  return getIronSession<VisitorChatSession>(cookieStore, getVisitorChatSessionOptions());
}

export async function ensureVisitorToken() {
  const session = await getVisitorChatSession();
  if (!session.visitorToken || session.visitorToken.length < 48) {
    session.visitorToken = randomToken(48);
    await session.save();
  }
  return session.visitorToken;
}

export function visitorTokenHash(token: string) {
  return sha256(`visitor-chat:${token}`);
}

export async function getOrCreateVisitorConversation() {
  const token = await ensureVisitorToken();
  const tokenHash = visitorTokenHash(token);
  const existing = await prisma.visitorConversation.findUnique({
    where: { visitorTokenHash: tokenHash },
  });
  if (existing) return { conversation: existing, token };
  const conversation = await prisma.visitorConversation.create({
    data: { visitorTokenHash: tokenHash },
  });
  return { conversation, token };
}

export async function getOwnedVisitorConversation() {
  const session = await getVisitorChatSession();
  if (!session.visitorToken) return null;
  return prisma.visitorConversation.findUnique({
    where: { visitorTokenHash: visitorTokenHash(session.visitorToken) },
  });
}

export async function clearVisitorChatAccess() {
  const session = await getVisitorChatSession();
  session.visitorToken = undefined;
  await session.save();
}

export function serializeVisitorMessage(message: {
  publicId: string;
  senderRole: "VISITOR" | "ADMIN";
  body: string;
  status: "SENT" | "DELIVERED" | "READ";
  deliveredAt: Date | null;
  readAt: Date | null;
  visitorReadAt: Date | null;
  createdAt: Date;
}) {
  const ticks =
    message.senderRole === "ADMIN"
      ? null
      : message.status === "READ" || message.readAt
        ? "read"
        : message.status === "DELIVERED" || message.deliveredAt
          ? "delivered"
          : "sent";

  return {
    id: message.publicId,
    senderRole: message.senderRole === "ADMIN" ? "admin" : "visitor",
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    deliveredAt: message.deliveredAt?.toISOString() || null,
    readAt: message.readAt?.toISOString() || null,
    ticks,
    statusLabel:
      message.senderRole === "ADMIN"
        ? "Reply from Admin"
        : ticks === "read"
          ? "Seen by Admin"
          : ticks === "delivered"
            ? "Delivered"
            : "Sent",
  };
}
