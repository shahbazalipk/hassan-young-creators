import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";
import { parseAge } from "@/lib/quiz/age-bands";
import { recordQuestionHistory, selectQuestionsForPlayer } from "@/lib/quiz/select-questions";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/security";
import { getOrCreateAnonymousVisitorKey } from "@/lib/visitors";
import { requireUser } from "@/lib/auth";
import { AppUserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`quiz-start:${hashIp(ip)}`, 30, 15 * 60 * 1000);
  if (!limit.ok) return jsonError("Too many quiz starts. Please wait.", 429);

  const body = await request.json().catch(() => null);
  const app = typeof body?.app === "string" ? body.app : "flash-cards";
  const displayName = String(body?.displayName || "").trim().slice(0, 40);
  const age = parseAge(body?.age);
  const count = Number(body?.count || 10);

  const authed = await requireUser();
  const { visitorKey } = await getOrCreateAnonymousVisitorKey();

  // Account-linked identity requires verified email (admins exempt). Guests may still play.
  const useAccountIdentity = Boolean(
    authed &&
      (authed.user.emailVerified || authed.user.role === AppUserRole.ADMIN)
  );

  const playerKey = useAccountIdentity
    ? `user:${authed!.user.id}`
    : typeof body?.playerKey === "string" && body.playerKey.length > 8
      ? String(body.playerKey).slice(0, 120)
      : visitorKey;

  const resolvedName =
    (useAccountIdentity && authed?.user.displayName) || displayName;

  if (resolvedName.length < 2) {
    return jsonError("Please enter a display name (at least 2 characters).");
  }
  if (age == null) return jsonError("Age must be a whole number between 5 and 120.");
  if (app === "flash-cards" && (age < 5 || age > 17)) {
    return jsonError("Age must be between 5 and 17 for Flash Cards.");
  }

  const selected = await selectQuestionsForPlayer({ app, playerKey, age, count });
  if ("error" in selected) return jsonError(selected.error);

  const session = await prisma.quizSession.create({
    data: {
      app,
      playerKey,
      displayName: resolvedName,
      age,
      ageBand: selected.ageBand,
      questionIdsJson: JSON.stringify(selected.internal.map((q) => q.id)),
      answersJson: JSON.stringify(
        selected.internal.map((q) => ({
          questionId: q.id,
          correctIndex: q.correctIndex,
        }))
      ),
      totalQuestions: selected.internal.length,
      status: "active",
    },
  });

  await recordQuestionHistory(
    app,
    playerKey,
    selected.internal.map((q) => q.id)
  );

  return jsonOk({
    sessionId: session.id,
    ageBand: selected.ageBand,
    playerKey,
    questions: selected.questions,
    authenticated: useAccountIdentity,
    needsEmailVerification: Boolean(authed && !useAccountIdentity),
  });
}
