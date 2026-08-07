import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "parent@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe-StrongPassword-123!";

async function clearLoginLimits() {
  const prisma = new PrismaClient();
  await prisma.rateLimitBucket.deleteMany({
    where: { OR: [{ id: { startsWith: "login:" } }, { id: { startsWith: "admin-delete" } }] },
  });
  await prisma.adminUser.updateMany({ data: { failedLoginAttempts: 0, lockedUntil: null } });
  await prisma.$disconnect();
}

async function adminLogin(request: import("@playwright/test").APIRequestContext) {
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await clearLoginLimits();
    const bootstrapRes = await request.get("/api/auth");
    if (!bootstrapRes.ok()) {
      lastError = await bootstrapRes.text();
      await new Promise((r) => setTimeout(r, 400));
      continue;
    }
    const bootstrap = await bootstrapRes.json();
    const login = await request.post("/api/auth", {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        csrfToken: bootstrap.csrfToken,
      },
    });
    if (!login.ok()) {
      lastError = await login.text();
      await new Promise((r) => setTimeout(r, 400));
      continue;
    }
    const csrf = await request.get("/api/csrf");
    const csrfJson = await csrf.json();
    expect(csrfJson.csrfToken).toBeTruthy();
    return csrfJson.csrfToken as string;
  }
  throw new Error(`Admin login failed after retries: ${lastError}`);
}

test.describe("Admin safe deletion controls", () => {
  test.describe.configure({ mode: "serial" });

  test("visitors cannot access deletion endpoints", async ({ request }) => {
    const scoped = await request.post("/api/admin/delete-all", {
      data: { scope: "projects", confirm: true, csrfToken: "fake" },
    });
    const global = await request.post("/api/admin/delete-all-data", {
      data: { confirm: true, csrfToken: "fake" },
    });
    const backup = await request.get("/api/admin/backup");
    const activity = await request.delete("/api/admin/activity", {
      data: { id: "x", confirm: true, csrfToken: "fake" },
    });

    expect(scoped.status()).toBe(401);
    expect(global.status()).toBe(401);
    expect(backup.status()).toBe(401);
    expect(activity.status()).toBe(401);
  });

  test("individual project delete removes only that project", async ({ request }) => {
    const csrfToken = await adminLogin(request);
    const prisma = new PrismaClient();

    const keep = await prisma.project.create({
      data: {
        title: `Keep Project ${Date.now()}`,
        description: "Should remain after sibling delete.",
        technologies: '["HTML"]',
        status: "DRAFT",
        sortOrder: 9001,
      },
    });
    const remove = await prisma.project.create({
      data: {
        title: `Delete Project ${Date.now()}`,
        description: "Should be removed.",
        technologies: '["CSS"]',
        status: "DRAFT",
        sortOrder: 9002,
      },
    });

    const cancelled = await request.delete("/api/admin/projects", {
      data: { id: remove.id, csrfToken },
    });
    expect(cancelled.status()).toBe(400);
    expect((await prisma.project.findUnique({ where: { id: remove.id } }))).not.toBeNull();

    const deleted = await request.delete("/api/admin/projects", {
      data: { id: remove.id, confirm: true, csrfToken },
    });
    expect(deleted.ok()).toBeTruthy();
    expect(await prisma.project.findUnique({ where: { id: remove.id } })).toBeNull();
    expect(await prisma.project.findUnique({ where: { id: keep.id } })).not.toBeNull();

    await prisma.project.delete({ where: { id: keep.id } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  test("section delete-all only affects that scope", async ({ request }) => {
    const csrfToken = await adminLogin(request);
    const prisma = new PrismaClient();

    const badge = await prisma.badge.create({
      data: {
        name: `Temp Badge ${Date.now()}`,
        description: "Temporary badge for delete-all test.",
        icon: "🧪",
        color: "#123456",
        sortOrder: 9999,
      },
    });
    const project = await prisma.project.create({
      data: {
        title: `Scope Keep ${Date.now()}`,
        description: "Must survive badge wipe.",
        technologies: '["JS"]',
        status: "DRAFT",
        sortOrder: 9010,
      },
    });

    const wipe = await request.post("/api/admin/delete-all", {
      data: { scope: "badges", confirm: true, csrfToken },
    });
    expect(wipe.ok(), await wipe.text()).toBeTruthy();
    expect(await prisma.badge.findUnique({ where: { id: badge.id } })).toBeNull();
    expect(await prisma.project.findUnique({ where: { id: project.id } })).not.toBeNull();

    await prisma.project.delete({ where: { id: project.id } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  test("cancel leaves data unchanged and dialog uses Continue", async ({ page }) => {
    await adminLogin(page.request);
    const prisma = new PrismaClient();
    const project = await prisma.project.create({
      data: {
        title: `Cancel Keep ${Date.now()}`,
        description: "Must remain after cancel.",
        technologies: '["Keep"]',
        status: "DRAFT",
        sortOrder: 9600,
      },
    });

    await page.goto("/admin");
    await page.getByRole("button", { name: "Delete All Admin Data" }).click();
    await expect(
      page.getByText(
        "Are you sure you want to delete all Admin Panel data? This action cannot be undone."
      )
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByText(
        "Are you sure you want to delete all Admin Panel data? This action cannot be undone."
      )
    ).toHaveCount(0);
    expect(await prisma.project.findUnique({ where: { id: project.id } })).not.toBeNull();

    await prisma.project.delete({ where: { id: project.id } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  test("backup download is safe and dated", async ({ request }) => {
    const csrfToken = await adminLogin(request);
    expect(csrfToken).toBeTruthy();

    const backup = await request.get("/api/admin/backup");
    expect(backup.ok()).toBeTruthy();
    expect(backup.headers()["content-type"]).toContain("application/json");
    expect(backup.headers()["x-backup-created-at"]).toBeTruthy();

    const payload = await backup.json();
    expect(payload.format).toBe("hassan-admin-backup-v1");
    expect(payload.createdAt).toBeTruthy();
    const raw = JSON.stringify(payload);
    expect(raw).not.toMatch(/passwordHash|totpSecret|resetTokenHash|visitorTokenHash|SESSION_SECRET/);
  });

  test("admin UI exposes Danger Zone and confirm dialogs", async ({ page }) => {
    await adminLogin(page.request);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Danger Zone" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete All Admin Data" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download Backup First" })).toBeVisible();

    await page.goto("/admin/projects");
    await expect(page.getByRole("button", { name: "More Actions" })).toBeVisible();
    await page.getByRole("button", { name: "More Actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Delete All Projects" })).toBeVisible();
  });

  test("global deletion preserves essential public content", async ({ request }) => {
    const csrfToken = await adminLogin(request);

    const missingConfirm = await request.post("/api/admin/delete-all-data", {
      data: { csrfToken },
    });
    expect(missingConfirm.status()).toBe(400);

    const prisma = new PrismaClient();
    const marker = await prisma.contactMessage.create({
      data: {
        senderName: "Temp Visitor",
        senderEmail: "temp@example.com",
        subject: `Wipe Marker ${Date.now()}`,
        body: "Temporary message for wipe test.",
      },
    });

    const wipe = await request.post("/api/admin/delete-all-data", {
      data: { csrfToken, confirm: true },
    });
    expect(wipe.ok(), await wipe.text()).toBeTruthy();
    const body = await wipe.json();
    expect(body.message).toMatch(/Essential public website content was preserved/i);
    expect(await prisma.contactMessage.findUnique({ where: { id: marker.id } })).toBeNull();

    expect(await prisma.project.count()).toBeGreaterThanOrEqual(2);
    expect(await prisma.skill.count()).toBeGreaterThanOrEqual(8);
    expect(await prisma.inspirationMessage.count()).toBeGreaterThanOrEqual(5);
    expect(await prisma.learningResource.count()).toBeGreaterThanOrEqual(7);
    expect(await prisma.parentCornerCard.count()).toBeGreaterThanOrEqual(6);

    const projects = await prisma.project.findMany({ select: { title: true } });
    expect(projects.map((p) => p.title).sort()).toEqual(["Flash Cards", "KidMind AI"]);

    const admin = await prisma.adminUser.findFirst({
      where: { email: ADMIN_EMAIL.toLowerCase() },
    });
    expect(admin).not.toBeNull();
    expect(admin?.passwordHash).toBeTruthy();
    await prisma.$disconnect();
  });

  test("restore defaults is idempotent", async ({ request }) => {
    const csrfToken = await adminLogin(request);
    const prisma = new PrismaClient();

    const first = await request.post("/api/admin/restore-defaults", {
      data: { csrfToken },
    });
    expect(first.ok(), await first.text()).toBeTruthy();
    const before = {
      projects: await prisma.project.count(),
      skills: await prisma.skill.count(),
      inspiration: await prisma.inspirationMessage.count(),
      resources: await prisma.learningResource.count(),
    };

    const second = await request.post("/api/admin/restore-defaults", {
      data: { csrfToken },
    });
    expect(second.ok(), await second.text()).toBeTruthy();
    const secondBody = await second.json();
    expect(secondBody.createdCount).toBe(0);

    expect(await prisma.project.count()).toBe(before.projects);
    expect(await prisma.skill.count()).toBe(before.skills);
    expect(await prisma.inspirationMessage.count()).toBe(before.inspiration);
    expect(await prisma.learningResource.count()).toBe(before.resources);
    await prisma.$disconnect();
  });
});
