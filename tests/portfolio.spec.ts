import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test.describe("Hassan young creators platform", () => {
  test("public homepage loads key sections", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page).toHaveTitle(/Hassan/i);
    await expect(page.getByRole("heading", { name: "About Me" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Young Creators Club" })).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByText("Contact managed by Hassan’s parent/guardian.")
    ).toBeVisible();
    await expect(
      page.getByText("If I can start creating at 10, you can start too", { exact: false })
    ).toBeVisible();
  });

  test("admin login page is available", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
    await expect(page.getByText("parent or guardian", { exact: false })).toBeVisible();
  });

  test("shows two live projects with working use links", async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#projects");
    await expect(page.getByRole("heading", { name: "My Two Websites" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Flash Cards", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Use KidMind AI" })).toHaveAttribute(
      "href",
      "http://localhost:5173/"
    );
    await expect(page.getByRole("link", { name: "Use Flash Cards" })).toHaveAttribute(
      "href",
      "http://127.0.0.1:8765/index.html"
    );
    await expect(page.getByText("Creative Website")).toHaveCount(0);

    const flashLink = page.getByRole("link", { name: "Use Flash Cards" });
    await flashLink.scrollIntoViewIfNeeded();
    const [popup] = await Promise.all([context.waitForEvent("page"), flashLink.click()]);
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup).toHaveURL("http://127.0.0.1:8765/index.html");
    await expect(popup.getByRole("heading", { name: "Ready to Slash?" })).toBeVisible();
    await expect(popup.getByRole("button", { name: "Start Playing" })).toBeVisible();
  });

  test("public site has no Admin Panel button or link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#admin-sidebar")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: /Admin Panel/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Admin Panel|Open Admin|Parent Admin/i })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Contact" })).toHaveCount(0);
    await expect(page.locator("#contact")).toHaveCount(0);
    await expect(page.getByText("Say hello")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Let’s Connect" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Inspiration Wall" })).toBeVisible();
    await expect(page.getByText("Every expert was once a beginner.")).toBeVisible();
  });

  test("Admin Panel appears in public nav only while admin session is valid", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Achievements" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Skills" })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Admin Panel/i })).toHaveCount(0);

    const bootstrap = await (await page.request.get("/api/auth")).json();
    const login = await page.request.post("/api/auth", {
      data: {
        email: process.env.ADMIN_EMAIL || "parent@example.com",
        password: process.env.ADMIN_PASSWORD || "ChangeMe-StrongPassword-123!",
        csrfToken: bootstrap.csrfToken,
      },
    });
    expect(login.ok(), await login.text()).toBeTruthy();

    await page.goto("/");
    await expect(nav.getByRole("link", { name: /Admin Panel/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Admin Panel/i })).toHaveAttribute("href", "/admin");

    await nav.getByRole("link", { name: /Admin Panel/i }).click();
    await expect(page).toHaveURL(/\/admin(?:\/)?$/);
    await expect(page.locator("#admin-sidebar")).toBeVisible();

    await page.goto("/");
    await expect(nav.getByRole("link", { name: /Admin Panel/i })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: /Open menu|Close menu/i }).click();
    await expect(nav.getByRole("link", { name: /Admin Panel/i })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin");
    await page.locator("#admin-sidebar").getByRole("button", { name: /^Logout$/ }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto("/");
    await expect(nav.getByRole("link", { name: /Admin Panel/i })).toHaveCount(0);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("unauthenticated visitors are redirected to admin login", async ({ page }) => {
    await page.goto("/admin/projects");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("public contact and inspiration APIs are unavailable", async ({ request }) => {
    const contact = await request.post("/api/contact", { data: {} });
    const inspiration = await request.post("/api/inspiration", { data: {} });
    expect(contact.status()).toBe(404);
    expect(inspiration.status()).toBe(404);
  });
  test("visitor messaging is private, admin-backed, and child-safe", async ({ page, browser }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Message the Admin" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Write a Message" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Your Messages/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Admin Panel/i })).toHaveCount(0);

    await page.getByRole("button", { name: "Write a Message" }).click();
    await expect(page.getByRole("dialog", { name: "Your Messages" })).toBeVisible();
    await expect(
      page.getByText("Please do not share your full name, email, phone number, school, address")
    ).toBeVisible();

    const unsafe = await page.request.post("/api/visitor-chat", {
      data: {
        message: "Call me at 555-123-4567 or email kid@example.com",
        website: "",
        csrfToken: (await (await page.request.get("/api/csrf")).json()).csrfToken,
      },
    });
    expect(unsafe.ok()).toBeFalsy();

    const subject = `Hello admin ${Date.now()}`;
    await page.getByLabel("Write a message to the admin").fill(subject);
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.locator(".visitor-bubble.visitor").getByText(subject)).toBeVisible();
    await expect(page.locator(".vm-ticks").first()).toHaveAttribute("title", "Delivered");

    // Another browser cannot see this conversation.
    const other = await browser.newPage();
    await other.goto("/");
    await other.getByRole("button", { name: /Your Messages/i }).click();
    await expect(other.getByText(subject)).toHaveCount(0);
    await other.close();

    // Admin login and reply
    const bootstrap = await (await page.request.get("/api/auth")).json();
    const login = await page.request.post("/api/auth", {
      data: {
        email: process.env.ADMIN_EMAIL || "parent@example.com",
        password: process.env.ADMIN_PASSWORD || "ChangeMe-StrongPassword-123!",
        csrfToken: bootstrap.csrfToken,
      },
    });
    expect(login.ok()).toBeTruthy();

    await page.goto("/admin/visitor-messages");
    await expect(page.locator("#admin-sidebar").getByText("Visitor Messages")).toBeVisible();
    await page.getByRole("button", { name: /Visitor conversation/ }).first().click();
    await expect(page.getByText(subject)).toBeVisible();

    const reply = `Admin reply ${Date.now()}`;
    await page.getByLabel("Reply as Admin").fill(reply);
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText(reply)).toBeVisible();

    // Back to public visitor view in same browser/session
    await page.goto("/");
    await expect
      .poll(async () => {
        const data = await (await page.request.get("/api/visitor-chat")).json();
        return Number(data.unreadAdminReplies) || 0;
      })
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: /Your Messages/i }).click();
    await expect(page.getByText(reply)).toBeVisible();
    await expect(page.getByText("Reply from Admin").first()).toBeVisible();
    await expect
      .poll(async () => {
        const data = await (await page.request.get("/api/visitor-chat")).json();
        return Number(data.unreadAdminReplies) || 0;
      })
      .toBe(0);

    // Blue ticks after admin opened conversation
    await expect(page.locator('.vm-ticks[title="Seen by Admin"]').first()).toBeVisible();
  });
});

test.describe("Admin sidebar navigation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    const bootstrap = await (await page.request.get("/api/auth")).json();
    if (!bootstrap.isLoggedIn) {
      const login = await page.request.post("/api/auth", {
        data: {
          email: process.env.ADMIN_EMAIL || "parent@example.com",
          password: process.env.ADMIN_PASSWORD || "ChangeMe-StrongPassword-123!",
          csrfToken: bootstrap.csrfToken,
        },
      });
      expect(login.ok(), await login.text()).toBeTruthy();
    }

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin(?:\/)?$/);
    await expect(page.locator("#admin-sidebar")).toBeVisible();
  });

  test("shows Admin Panel branding and welcome text", async ({ page }) => {
    await expect(page.locator("#admin-sidebar").getByText("Admin Panel", { exact: true })).toBeVisible();
    await expect(page.locator("#admin-sidebar").getByText("Welcome, Admin")).toBeVisible();
  });

  test("every sidebar item opens the correct page", async ({ page }) => {
    const routes: Array<[string, string]> = [
      ["Dashboard", "/admin"],
      ["Messages", "/admin/messages"],
      ["Visitor Messages", "/admin/visitor-messages"],
      ["Projects", "/admin/projects"],
      ["Hassan’s Profile", "/admin/profile"],
      ["Daily Missions", "/admin/missions"],
      ["Games & Challenges", "/admin/games"],
      ["Submissions", "/admin/submissions"],
      ["Badges & Rewards", "/admin/badges"],
      ["Learning Resources", "/admin/resources"],
      ["Website Settings", "/admin/settings"],
    ];

    for (const [label, path] of routes) {
      await page.locator("#admin-sidebar").locator(`a[title="${label}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator("#admin-sidebar a[aria-current='page']")).toHaveAttribute(
        "title",
        label
      );
    }

    await expect(
      page.locator("#admin-sidebar").getByRole("link", { name: /View Public Website/ })
    ).toHaveAttribute("href", "/");
  });

  test("projects page lists KidMind AI and Flash Cards with development URLs", async ({
    page,
  }) => {
    await page.goto("/admin/projects");
    await expect(page.getByRole("heading", { name: "KidMind AI", exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Flash Cards", exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "http://localhost:5173/" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "http://127.0.0.1:8765/index.html" })
    ).toBeVisible();
  });

  test("unread message badge updates when messages change", async ({ page }) => {
    const prisma = new PrismaClient();
    const subject = `Sidebar badge ${Date.now()}`;
    await prisma.contactMessage.create({
      data: {
        senderName: "Badge Tester",
        senderEmail: "badge-tester@example.com",
        subject,
        body: "Checking the unread badge updates correctly.",
        status: "UNREAD",
        emailDeliveryStatus: "saved_only",
        emailDeliveryNote: "Test seed",
        ipHash: "test",
      },
    });
    await prisma.$disconnect();

    await page.goto("/admin/messages");
    await expect(
      page.locator("#admin-sidebar a[title='Messages'] .admin-nav-badge")
    ).toBeVisible();
    const unreadBefore = (await (await page.request.get("/api/admin/messages/unread")).json())
      .unreadCount as number;

    await page.locator("button.admin-card").filter({ hasText: subject }).click();
    await expect(page.getByRole("definition").filter({ hasText: "Badge Tester" })).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: "badge-tester@example.com" })
    ).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: /Email delivered|Email failed|Saved in inbox/i })
    ).toBeVisible();
    await expect
      .poll(async () => (await (await page.request.get("/api/admin/messages/unread")).json()).unreadCount)
      .toBe(unreadBefore - 1);

    await page.getByRole("button", { name: "Mark unread" }).click();
    await expect(
      page.locator("#admin-sidebar a[title='Messages'] .admin-nav-badge")
    ).toBeVisible();
    await expect
      .poll(async () => (await (await page.request.get("/api/admin/messages/unread")).json()).unreadCount)
      .toBe(unreadBefore);

    await page.getByRole("button", { name: "Archive" }).click();
    await expect
      .poll(async () => (await (await page.request.get("/api/admin/messages/unread")).json()).unreadCount)
      .toBe(unreadBefore - 1);
  });

  test("collapse preference persists and mobile menu closes after navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole("button", { name: "Collapse nav" }).click();
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("hassan-admin-sidebar-collapsed")))
      .toBe("1");
    await page.reload();
    await expect(page.locator("#admin-sidebar")).toHaveClass(/w-\[88px\]/);
    await page.getByRole("button", { name: "Expand nav" }).click();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");
    await page.getByRole("button", { name: /Menu/i }).click();
    await expect(page.getByLabel("Close sidebar backdrop")).toBeVisible();
    await page.locator("#admin-sidebar").getByRole("link", { name: /Projects/ }).click();
    await expect(page).toHaveURL(/\/admin\/projects$/);
    await expect(page.locator("#admin-sidebar")).toHaveClass(/-translate-x-full/);
  });

  test("logout removes the sidebar and ends the session", async ({ page }) => {
    await page.locator("#admin-sidebar").getByRole("button", { name: /^Logout$/ }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator("#admin-sidebar")).toHaveCount(0);
    await page.goto("/admin/messages");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
