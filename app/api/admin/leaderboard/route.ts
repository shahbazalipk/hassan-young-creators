import { NextRequest } from "next/server";
import { jsonOk, requireAdminApi } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const url = new URL(request.url);
  const app = url.searchParams.get("app") || "flash-cards";
  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit") || 50)));

  const [entries, count] = await Promise.all([
    prisma.leaderboardEntry.findMany({
      where: { app },
      orderBy: [
        { scorePercent: "desc" },
        { correctCount: "desc" },
        { durationMs: "asc" },
        { completedAt: "asc" },
      ],
      take: limit,
    }),
    prisma.leaderboardEntry.count({ where: { app } }),
  ]);

  return jsonOk({ entries, total: count });
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return jsonOk({ deleted: 0 });

  await prisma.leaderboardEntry.delete({ where: { id } }).catch(() => null);
  return jsonOk({ deleted: 1 });
}
