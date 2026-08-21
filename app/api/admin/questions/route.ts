import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { prisma } from "@/lib/db";
import { AGE_BANDS } from "@/lib/quiz/age-bands";

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const app = "flash-cards";
  const [total, active, inactive, duplicates, byBandRaw, sample] = await Promise.all([
    prisma.quizQuestion.count({ where: { app } }),
    prisma.quizQuestion.count({ where: { app, isActive: true } }),
    prisma.quizQuestion.count({ where: { app, isActive: false } }),
    prisma.quizQuestion.groupBy({
      by: ["contentHash"],
      where: { app },
      _count: { contentHash: true },
      having: { contentHash: { _count: { gt: 1 } } },
    }),
    prisma.quizQuestion.findMany({
      where: { app, isActive: true },
      select: { minAge: true, maxAge: true },
    }),
    prisma.quizQuestion.findMany({
      where: { app },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        publicId: true,
        text: true,
        minAge: true,
        maxAge: true,
        difficulty: true,
        category: true,
        isActive: true,
        source: true,
      },
    }),
  ]);

  const byAgeBand = AGE_BANDS.map((band) => ({
    id: band.id,
    label: band.label,
    count: byBandRaw.filter((q) => q.minAge <= band.maxAge && q.maxAge >= band.minAge).length,
  }));

  const duplicateQuestionCount = duplicates.reduce((sum, d) => sum + d._count.contentHash, 0);

  return jsonOk({
    stats: {
      total,
      active,
      inactive,
      duplicateGroups: duplicates.length,
      duplicateQuestionCount,
      byAgeBand,
    },
    questions: sample,
  });
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return jsonError("Question id required.");
  if (typeof body?.isActive !== "boolean") return jsonError("isActive boolean required.");

  const updated = await prisma.quizQuestion.update({
    where: { id },
    data: { isActive: body.isActive },
    select: { id: true, publicId: true, isActive: true },
  });

  return jsonOk({ question: updated });
}
