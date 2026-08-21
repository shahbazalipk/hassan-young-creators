import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const app = url.searchParams.get("app") || "flash-cards";
  const limit = Math.min(100, Math.max(5, Number(url.searchParams.get("limit") || 20)));
  const cursor = url.searchParams.get("cursor");

  const rows = await prisma.leaderboardEntry.findMany({
    where: { app },
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
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return jsonOk({
    entries: items,
    nextCursor: hasMore ? items[items.length - 1]?.id || null : null,
  });
}
