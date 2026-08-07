import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import { z } from "zod";

const resourceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(120),
  description: z.string().min(5).max(500),
  category: z.string().min(2).max(80),
  url: z.string().url().optional().nullable().or(z.literal("")),
  isExternal: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  csrfToken: z.string().min(10),
});

const badgeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  description: z.string().min(5).max(300),
  icon: z.string().min(1).max(8),
  color: z.string().min(4).max(20),
  isActive: z.boolean().default(true),
  csrfToken: z.string().min(10),
});

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const [resources, badges] = await Promise.all([
    prisma.learningResource.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.badge.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return jsonOk({ resources, badges });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const kind = body?.kind as "resource" | "badge";

  if (kind === "badge") {
    const parsed = badgeSchema.safeParse(body);
    if (!parsed.success) return jsonError("Please check the badge fields.");
    const csrfFail = requireCsrf(parsed.data.csrfToken);
    if (csrfFail) return csrfFail;
    const maxSort = await prisma.badge.aggregate({ _max: { sortOrder: true } });
    const badge = await prisma.badge.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        icon: parsed.data.icon,
        color: parsed.data.color,
        isActive: parsed.data.isActive,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });
    await logActivity("BADGE_UPDATE", `Created badge “${badge.name}”`, auth.user.id);
    return jsonOk({ badge }, 201);
  }

  const parsed = resourceSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check the resource fields.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const maxSort = await prisma.learningResource.aggregate({ _max: { sortOrder: true } });
  const resource = await prisma.learningResource.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      url: parsed.data.url || null,
      isExternal: Boolean(parsed.data.url),
      isPublished: parsed.data.isPublished,
      sortOrder: (maxSort._max.sortOrder || 0) + 1,
    },
  });
  await logActivity("RESOURCE_UPDATE", `Created resource “${resource.title}”`, auth.user.id);
  return jsonOk({ resource }, 201);
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const kind = body?.kind as "resource" | "badge";

  if (kind === "badge") {
    const parsed = badgeSchema.safeParse(body);
    if (!parsed.success || !parsed.data.id) return jsonError("Please check the badge fields.");
    const csrfFail = requireCsrf(parsed.data.csrfToken);
    if (csrfFail) return csrfFail;
    const badge = await prisma.badge.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        icon: parsed.data.icon,
        color: parsed.data.color,
        isActive: parsed.data.isActive,
      },
    });
    await logActivity("BADGE_UPDATE", `Updated badge “${badge.name}”`, auth.user.id);
    return jsonOk({ badge });
  }

  const parsed = resourceSchema.safeParse(body);
  if (!parsed.success || !parsed.data.id) return jsonError("Please check the resource fields.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const resource = await prisma.learningResource.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      url: parsed.data.url || null,
      isExternal: Boolean(parsed.data.url),
      isPublished: parsed.data.isPublished,
    },
  });
  await logActivity("RESOURCE_UPDATE", `Updated resource “${resource.title}”`, auth.user.id);
  return jsonOk({ resource });
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;
  if (body?.confirm !== true) return jsonError("Deletion requires confirmation.");
  const id = String(body?.id || "");
  const kind = body?.kind as "resource" | "badge";
  if (!id || !kind) return jsonError("Missing id or kind.");

  if (kind === "badge") {
    const badge = await prisma.badge.delete({ where: { id } });
    await logActivity("BADGE_UPDATE", `Deleted badge “${badge.name}”`, auth.user.id);
  } else {
    const resource = await prisma.learningResource.delete({ where: { id } });
    await logActivity("RESOURCE_UPDATE", `Deleted resource “${resource.title}”`, auth.user.id);
  }

  return jsonOk({ message: "Deleted." });
}
