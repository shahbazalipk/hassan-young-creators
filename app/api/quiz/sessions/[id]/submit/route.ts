import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/security";

type AnswerPayload = { questionId: string; selectedIndex: number };

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`quiz-submit:${hashIp(ip)}`, 40, 15 * 60 * 1000);
  if (!limit.ok) return jsonError("Too many submissions. Please wait.", 429);

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const answers = Array.isArray(body?.answers) ? (body.answers as AnswerPayload[]) : [];
  const durationMs = Number.isFinite(Number(body?.durationMs))
    ? Math.max(0, Math.min(Number(body.durationMs), 1000 * 60 * 60))
    : null;

  const session = await prisma.quizSession.findUnique({ where: { id } });
  if (!session) return jsonError("Quiz session not found.", 404);
  if (session.status === "submitted") {
    const existing = await prisma.leaderboardEntry.findUnique({ where: { sessionId: id } });
    return jsonOk({
      alreadySubmitted: true,
      score: session.correctCount,
      total: session.totalQuestions,
      percent: session.scorePercent,
      leaderboardId: existing?.id || null,
    });
  }
  if (session.status !== "active") return jsonError("This quiz session is no longer active.", 409);

  const answerKey = new Map(
    (JSON.parse(session.answersJson) as { questionId: string; correctIndex: number }[]).map(
      (a) => [a.questionId, a.correctIndex]
    )
  );
  const questionIds = JSON.parse(session.questionIdsJson) as string[];
  if (answers.length !== questionIds.length) {
    return jsonError("Incomplete answers for this quiz session.");
  }

  const seen = new Set<string>();
  let correct = 0;
  for (const ans of answers) {
    if (!ans || typeof ans.questionId !== "string") return jsonError("Invalid answer payload.");
    if (seen.has(ans.questionId)) return jsonError("Duplicate answers are not allowed.");
    seen.add(ans.questionId);
    if (!answerKey.has(ans.questionId)) return jsonError("Answer does not belong to this session.");
    const selected = Number(ans.selectedIndex);
    // -1 = timed out / skipped (always incorrect)
    if (!Number.isInteger(selected) || selected < -1 || selected > 3) {
      return jsonError("Invalid selected answer index.");
    }
    if (selected >= 0 && answerKey.get(ans.questionId) === selected) correct += 1;
  }

  for (const qid of questionIds) {
    if (!seen.has(qid)) return jsonError("Missing answers for some questions.");
  }

  const percent = questionIds.length
    ? Math.round((correct / questionIds.length) * 100)
    : 0;

  const updated = await prisma.$transaction(async (tx) => {
    const sess = await tx.quizSession.update({
      where: { id },
      data: {
        status: "submitted",
        correctCount: correct,
        scorePercent: percent,
        durationMs,
        submittedAt: new Date(),
      },
    });

    const entry = await tx.leaderboardEntry.create({
      data: {
        app: sess.app,
        sessionId: sess.id,
        playerKey: sess.playerKey,
        displayName: sess.displayName,
        age: sess.age,
        ageBand: sess.ageBand,
        score: correct,
        correctCount: correct,
        totalQuestions: sess.totalQuestions,
        scorePercent: percent,
        category: sess.app,
        durationMs,
        completedAt: new Date(),
      },
    });

    return { sess, entry };
  });

  return jsonOk({
    score: updated.sess.correctCount,
    total: updated.sess.totalQuestions,
    percent: updated.sess.scorePercent,
    leaderboardId: updated.entry.id,
    ageBand: updated.sess.ageBand,
  });
}
