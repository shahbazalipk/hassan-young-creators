import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import { filterChildSafeText, stripControlChars } from "@/lib/security";

type Queue = "inspiration" | "guestbook" | "challenge";

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const [inspiration, guestbook, challenges] = await Promise.all([
    prisma.inspirationMessage.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guestbookEntry.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.challengeSubmission.findMany({
      where: { status: "PENDING" },
      include: { challenge: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return jsonOk({ inspiration, guestbook, challenges });
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  const id = String(body?.id || "");
  const queue = body?.queue as Queue;
  const action = body?.action as "APPROVE" | "REJECT" | "HIDE" | "BLOCK_IP" | "EDIT" | "DELETE";
  if (!id || !queue || !action) return jsonError("Missing moderation fields.");

  if (action === "DELETE") {
    if (body?.confirm !== true) return jsonError("Deletion requires confirmation.");
    if (queue === "inspiration") {
      await prisma.inspirationMessage.delete({ where: { id } });
    } else if (queue === "guestbook") {
      await prisma.guestbookEntry.delete({ where: { id } });
    } else {
      await prisma.challengeSubmission.delete({ where: { id } });
    }
    await logActivity("SUBMISSION_DELETE", `Deleted ${queue} submission`, auth.user.id, { queue });
    return jsonOk({ message: "Submission deleted." });
  }

  if (action === "EDIT") {
    const nickname = stripControlChars(String(body?.nickname || "Anonymous Creator"));
    const message = stripControlChars(String(body?.message || body?.note || ""));
    const nickCheck = filterChildSafeText(nickname);
    const msgCheck = filterChildSafeText(message);
    if (!nickCheck.ok) return jsonError(nickCheck.reason || "Unsafe nickname.");
    if (!msgCheck.ok) return jsonError(msgCheck.reason || "Unsafe message.");

    if (queue === "inspiration") {
      await prisma.inspirationMessage.update({
        where: { id },
        data: { nickname: nickCheck.cleaned, message: msgCheck.cleaned },
      });
    } else if (queue === "guestbook") {
      await prisma.guestbookEntry.update({
        where: { id },
        data: {
          nickname: nickCheck.cleaned,
          message: msgCheck.cleaned,
          moderatedNote: "Edited by parent/guardian before approval",
        },
      });
    } else {
      await prisma.challengeSubmission.update({
        where: { id },
        data: { nickname: nickCheck.cleaned, note: msgCheck.cleaned },
      });
    }

    await logActivity("SUBMISSION_APPROVE", `Edited ${queue} submission for safety`, auth.user.id);
    return jsonOk({ message: "Personal information removed / content updated." });
  }

  if (action === "BLOCK_IP") {
    const record =
      queue === "inspiration"
        ? await prisma.inspirationMessage.findUnique({ where: { id } })
        : queue === "guestbook"
          ? await prisma.guestbookEntry.findUnique({ where: { id } })
          : await prisma.challengeSubmission.findUnique({ where: { id } });
    if (record?.ipHash) {
      await prisma.blockedIp.upsert({
        where: { ipHash: record.ipHash },
        create: { ipHash: record.ipHash, reason: "Blocked by parent/admin" },
        update: { reason: "Blocked by parent/admin" },
      });
      await logActivity("SPAM_BLOCK", "Blocked a repeated spam source", auth.user.id);
    }
  }

  const status =
    action === "APPROVE" ? "APPROVED" : action === "HIDE" ? "HIDDEN" : "REJECTED";

  if (queue === "inspiration") {
    await prisma.inspirationMessage.update({ where: { id }, data: { status } });
  } else if (queue === "guestbook") {
    await prisma.guestbookEntry.update({ where: { id }, data: { status } });
  } else {
    await prisma.challengeSubmission.update({ where: { id }, data: { status } });
  }

  await logActivity(
    action === "APPROVE" ? "SUBMISSION_APPROVE" : "SUBMISSION_REJECT",
    `${action} ${queue} submission`,
    auth.user.id
  );

  return jsonOk({ message: "Moderation updated." });
}
