import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireCsrf } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { filterChildSafeText, getClientIp, hashIp } from "@/lib/security";
import { challengeCompleteSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings?.challengeSubmissionsOn || !settings.publicSubmissionsEnabled) {
    return jsonError("Challenge submissions are currently turned off.");
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const blocked = await prisma.blockedIp.findUnique({ where: { ipHash } });
  if (blocked) return jsonError("Unable to submit right now.", 403);

  const limit = await rateLimit(`challenge:${ipHash}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return jsonError("Please wait before submitting again.", 429);

  const body = await request.json().catch(() => null);
  const parsed = challengeCompleteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please complete the form carefully.");

  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const challenge = await prisma.challenge.findFirst({
    where: { id: parsed.data.challengeId, status: "PUBLISHED" },
  });
  if (!challenge) return jsonError("That challenge is not available.");

  const nicknameCheck = filterChildSafeText(parsed.data.nickname || "Anonymous Creator");
  const noteCheck = filterChildSafeText(parsed.data.note);
  if (!nicknameCheck.ok) return jsonError(nicknameCheck.reason || "Unsafe nickname.");
  if (!noteCheck.ok) return jsonError(noteCheck.reason || "Unsafe note.");

  await prisma.challengeSubmission.create({
    data: {
      challengeId: challenge.id,
      nickname: nicknameCheck.cleaned || "Anonymous Creator",
      note: noteCheck.cleaned,
      status: "PENDING",
      ipHash,
    },
  });

  return jsonOk({
    message:
      "Awesome effort! Your challenge note was sent for parent/guardian approval. Celebrate your progress!",
    celebrate: true,
  });
}
