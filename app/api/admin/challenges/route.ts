import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import { z } from "zod";

const challengeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(500),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  publishAt: z.string().nullable().optional(),
  csrfToken: z.string().min(10),
});

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const challenges = await prisma.challenge.findMany({ orderBy: { sortOrder: "asc" } });
  return jsonOk({ challenges });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const parsed = challengeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check the challenge fields.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const maxSort = await prisma.challenge.aggregate({ _max: { sortOrder: true } });
  const challenge = await prisma.challenge.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      publishAt: parsed.data.publishAt ? new Date(parsed.data.publishAt) : null,
      sortOrder: (maxSort._max.sortOrder || 0) + 1,
    },
  });
  await logActivity("CHALLENGE_UPDATE", `Created challenge “${challenge.title}”`, auth.user.id);
  return jsonOk({ challenge }, 201);
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const parsed = challengeSchema.safeParse(body);
  if (!parsed.success || !parsed.data.id) return jsonError("Please check the challenge fields.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const challenge = await prisma.challenge.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      publishAt: parsed.data.publishAt ? new Date(parsed.data.publishAt) : null,
    },
  });
  await logActivity("CHALLENGE_UPDATE", `Updated challenge “${challenge.title}”`, auth.user.id);
  return jsonOk({ challenge });
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;
  if (body?.confirm !== true) return jsonError("Deletion requires confirmation.");
  const id = String(body?.id || "");
  if (!id) return jsonError("Missing challenge id.");
  const challenge = await prisma.challenge.delete({ where: { id } });
  await logActivity("CHALLENGE_UPDATE", `Deleted challenge “${challenge.title}”`, auth.user.id);
  return jsonOk({ message: "Challenge deleted." });
}
