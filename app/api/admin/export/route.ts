import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const format = request.nextUrl.searchParams.get("format");
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (format === "csv") {
    const header = "id,senderName,senderEmail,subject,status,createdAt\n";
    const rows = messages
      .map((m) =>
        [
          m.id,
          csv(m.senderName),
          csv(m.senderEmail),
          csv(m.subject),
          m.status,
          m.createdAt.toISOString(),
        ].join(",")
      )
      .join("\n");
    return new Response(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hassan-messages.csv"',
      },
    });
  }

  return jsonOk({ messages });
}

export async function POST(request: NextRequest) {
  // Disable all public submissions instantly
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;

  await prisma.siteSettings.update({
    where: { id: 1 },
    data: {
      publicSubmissionsEnabled: false,
      guestbookEnabled: false,
      challengeSubmissionsOn: false,
    },
  });

  return jsonOk({ message: "All public submissions were disabled instantly." });
}

function csv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
