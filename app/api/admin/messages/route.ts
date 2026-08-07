import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const status = request.nextUrl.searchParams.get("status");
  const q = request.nextUrl.searchParams.get("q")?.trim();

  const messages = await prisma.contactMessage.findMany({
    where: {
      ...(status ? { status: status as "UNREAD" | "READ" | "ARCHIVED" } : {}),
      ...(q
        ? {
            OR: [
              { senderName: { contains: q } },
              { senderEmail: { contains: q } },
              { subject: { contains: q } },
              { body: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ messages });
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  const id = String(body?.id || "");
  const status = body?.status as "UNREAD" | "READ" | "ARCHIVED" | undefined;
  if (!id || !status) return jsonError("Missing message id or status.");

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });

  await logActivity(
    status === "ARCHIVED" ? "MESSAGE_ARCHIVE" : "MESSAGE_READ",
    `Message “${message.subject}” marked ${status.toLowerCase()}`,
    auth.user.id
  );

  return jsonOk({ message });
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;
  if (body?.confirm !== true) return jsonError("Deletion requires confirmation.");
  const id = String(body?.id || "");
  if (!id) return jsonError("Missing message id.");

  const message = await prisma.contactMessage.delete({ where: { id } });
  await logActivity("MESSAGE_DELETE", `Deleted message “${message.subject}”`, auth.user.id);
  return jsonOk({ message: "Message deleted." });
}
