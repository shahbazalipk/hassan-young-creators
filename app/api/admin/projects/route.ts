import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";
import { saveSafeImage } from "@/lib/uploads";

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return jsonOk({
    projects: projects.map((p) => ({
      ...p,
      technologies: JSON.parse(p.technologies || "[]"),
    })),
  });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const csrfToken = String(form.get("csrfToken") || "");
    const csrfFail = requireCsrf(csrfToken);
    if (csrfFail) return csrfFail;

    const title = String(form.get("title") || "");
    const description = String(form.get("description") || "");
    const technologies = String(form.get("technologies") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const url = String(form.get("url") || "") || null;
    const accent = String(form.get("accent") || "cyan");
    const status = String(form.get("status") || "DRAFT");
    const featured = String(form.get("featured") || "false") === "true";
    const completedAt = String(form.get("completedAt") || "") || null;
    const file = form.get("image");

    const parsed = projectSchema.safeParse({
      title,
      description,
      technologies,
      url,
      accent,
      status,
      featured,
      completedAt,
      csrfToken,
    });
    if (!parsed.success) return jsonError("Please check the project fields.");

    let imagePath: string | null = null;
    if (file instanceof File && file.size > 0) {
      try {
        imagePath = await saveSafeImage(file, "projects");
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : "Image upload failed.");
      }
    }

    const maxSort = await prisma.project.aggregate({ _max: { sortOrder: true } });
    const project = await prisma.project.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        technologies: JSON.stringify(parsed.data.technologies),
        url: parsed.data.url || null,
        accent: parsed.data.accent,
        status: parsed.data.status,
        featured: parsed.data.featured,
        completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : null,
        imagePath,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });

    await logActivity("PROJECT_CREATE", `Created project “${project.title}”`, auth.user.id);
    return jsonOk({ project }, 201);
  }

  const body = await request.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check the project fields.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const maxSort = await prisma.project.aggregate({ _max: { sortOrder: true } });
  const project = await prisma.project.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      technologies: JSON.stringify(parsed.data.technologies),
      url: parsed.data.url || null,
      accent: parsed.data.accent,
      status: parsed.data.status,
      featured: parsed.data.featured,
      completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : null,
      sortOrder: (maxSort._max.sortOrder || 0) + 1,
    },
  });

  await logActivity("PROJECT_CREATE", `Created project “${project.title}”`, auth.user.id);
  return jsonOk({ project }, 201);
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return jsonError("Missing project id.");

  if (body?.action === "reorder") {
    const csrfFail = requireCsrf(body.csrfToken);
    if (csrfFail) return csrfFail;
    const direction = body.direction === "up" ? -1 : 1;
    const current = await prisma.project.findUnique({ where: { id } });
    if (!current) return jsonError("Project not found.", 404);
    const swap = await prisma.project.findFirst({
      where:
        direction < 0
          ? { sortOrder: { lt: current.sortOrder } }
          : { sortOrder: { gt: current.sortOrder } },
      orderBy: { sortOrder: direction < 0 ? "desc" : "asc" },
    });
    if (swap) {
      await prisma.$transaction([
        prisma.project.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
        prisma.project.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
      ]);
    }
    await logActivity("PROJECT_UPDATE", `Reordered project “${current.title}”`, auth.user.id);
    return jsonOk({ message: "Order updated." });
  }

  if (body?.action === "toggle-publish") {
    const csrfFail = requireCsrf(body.csrfToken);
    if (csrfFail) return csrfFail;
    const current = await prisma.project.findUnique({ where: { id } });
    if (!current) return jsonError("Project not found.", 404);
    const status = current.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const project = await prisma.project.update({ where: { id }, data: { status } });
    await logActivity(
      "PROJECT_PUBLISH",
      `${status === "PUBLISHED" ? "Published" : "Unpublished"} “${project.title}”`,
      auth.user.id
    );
    return jsonOk({ project });
  }

  if (body?.action === "toggle-featured") {
    const csrfFail = requireCsrf(body.csrfToken);
    if (csrfFail) return csrfFail;
    const current = await prisma.project.findUnique({ where: { id } });
    if (!current) return jsonError("Project not found.", 404);
    const project = await prisma.project.update({
      where: { id },
      data: { featured: !current.featured },
    });
    await logActivity(
      "PROJECT_UPDATE",
      `${project.featured ? "Featured" : "Unfeatured"} “${project.title}”`,
      auth.user.id
    );
    return jsonOk({ project });
  }

  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check the project fields.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  const project = await prisma.project.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      technologies: JSON.stringify(parsed.data.technologies),
      url: parsed.data.url || null,
      accent: parsed.data.accent,
      status: parsed.data.status,
      featured: parsed.data.featured,
      completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : null,
      sortOrder: parsed.data.sortOrder,
    },
  });

  await logActivity("PROJECT_UPDATE", `Updated project “${project.title}”`, auth.user.id);
  return jsonOk({ project });
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  const csrfFail = requireCsrf(body?.csrfToken);
  if (csrfFail) return csrfFail;
  if (!id) return jsonError("Missing project id.");
  if (body?.confirm !== true) return jsonError("Deletion requires confirmation.");

  const { deleteProjectWithMedia } = await import("@/lib/admin/delete-data");
  const project = await deleteProjectWithMedia(id);
  if (!project) return jsonError("Project not found.", 404);
  await logActivity("PROJECT_DELETE", `Deleted project “${project.title}”`, auth.user.id);
  return jsonOk({ message: "Project deleted." });
}
