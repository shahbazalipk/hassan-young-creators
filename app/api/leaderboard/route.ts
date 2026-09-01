import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";

/**
 * Global Flash Cards leaderboard — production DB is the only source of truth.
 * Ranking: higher scorePercent, then more correct, then faster duration, then earlier completion.
 * Periods: all | week | month (UTC).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const app = url.searchParams.get("app") || "flash-cards";
  const limit = Math.min(100, Math.max(5, Number(url.searchParams.get("limit") || 20)));
  const cursor = url.searchParams.get("cursor");
  const period = String(url.searchParams.get("period") || "all").toLowerCase();

  const completedAtFilter =
    period === "week"
      ? { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      : period === "month"
        ? { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        : undefined;

  const rows = await prisma.leaderboardEntry.findMany({
    where: {
      app,
      ...(completedAtFilter ? { completedAt: completedAtFilter } : {}),
    },
    orderBy: [
      { scorePercent: "desc" },
      { correctCount: "desc" },
      { durationMs: "asc" },
      { completedAt: "asc" },
    ],
    take: limit + 1,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    select: {
      id: true,
      displayName: true,
      age: true,
      ageBand: true,
      score: true,
      correctCount: true,
      totalQuestions: true,
      scorePercent: true,
      durationMs: true,
      category: true,
      completedAt: true,
      playerKey: true,
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return jsonOk({
    entries: items.map((e) => ({
      id: e.id,
      displayName: e.displayName,
      age: e.age,
      ageBand: e.ageBand,
      score: e.score,
      correctCount: e.correctCount,
      totalQuestions: e.totalQuestions,
      scorePercent: e.scorePercent,
      durationMs: e.durationMs,
      category: e.category,
      completedAt: e.completedAt,
      // Never expose raw emails — playerKey is opaque (user:… / visitor:…).
    })),
    nextCursor: hasMore ? items[items.length - 1]?.id || null : null,
    period: period === "week" || period === "month" ? period : "all",
    rankingRules:
      "Ranked by score %, then correct answers, then faster time, then earlier finish (UTC).",
  });
}
