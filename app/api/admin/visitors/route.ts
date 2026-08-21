import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get("pageSize") || 25)));
  const skip = (page - 1) * pageSize;

  const [totalUnique, totalVisitSum, rows] = await Promise.all([
    prisma.siteVisitor.count(),
    prisma.siteVisitor.aggregate({ _sum: { visitCount: true } }),
    prisma.siteVisitor.findMany({
      orderBy: { lastVisitAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        displayName: true,
        email: true,
        photoUrl: true,
        isAnonymous: true,
        authStatus: true,
        firstVisitAt: true,
        lastVisitAt: true,
        visitCount: true,
      },
    }),
  ]);

  return jsonOk({
    totals: {
      uniqueVisitors: totalUnique,
      totalVisits: totalVisitSum._sum.visitCount || 0,
    },
    page,
    pageSize,
    visitors: rows,
  });
}
