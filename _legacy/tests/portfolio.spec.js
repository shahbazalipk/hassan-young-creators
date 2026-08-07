const { test, expect } = require("@playwright/test");

test.describe("Hassan portfolio", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("loads with correct title and hero brand", async ({ page }) => {
    await expect(page).toHaveTitle(/Hassan/i);
    await expect(page.locator(".hero-brand")).toHaveText("Hassan");
    await expect(page.locator("#typed-text")).toContainText("My name is Hassan");
  });

  test("shows all major sections", async ({ page }) => {
    const ids = [
      "about",
      "achievements",
      "skills",
      "projects",
      "capabilities",
      "journey",
      "goals",
      "fun-facts",
      "contact",
    ];

    for (const id of ids) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test("explore more scrolls to about", async ({ page }) => {
    await page.locator(".explore-btn").click();
    await expect(page.locator("#about")).toBeInViewport();
  });

  test("achievement counters and skill cards render", async ({ page }) => {
    await expect(page.locator(".achievement-card")).toHaveCount(6);
    await expect(page.locator(".skill-card")).toHaveCount(8);
    await expect(page.getByText("Websites Created")).toBeVisible();
  });

  test("project modal opens for placeholder links", async ({ page }) => {
    await page.locator("[data-project-modal]").first().click();
    await expect(page.locator("#project-modal")).toBeVisible();
    await expect(page.locator("#modal-title")).toHaveText("Project link coming soon");
    await page.locator(".modal-close").click();
    await expect(page.locator("#project-modal")).toBeHidden();
  });

  test("theme toggle switches theme", async ({ page }) => {
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.locator(".theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.locator(".theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });

  test("footer shows current year and signature line", async ({ page }) => {
    const year = String(new Date().getFullYear());
    await expect(page.locator("#footer-year")).toHaveText(year);
    await expect(page.locator("#footer-line")).toContainText(
      "Designed with curiosity and built with confidence by Hassan"
    );
  });

  test("contact placeholders open safe modal", async ({ page }) => {
    await page.locator("#contact [data-coming-soon]").first().click();
    await expect(page.locator("#modal-title")).toHaveText("Coming soon");
  });

  test("keyboard can close modal with Escape", async ({ page }) => {
    await page.locator("[data-project-modal]").first().click();
    await expect(page.locator("#project-modal")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#project-modal")).toBeHidden();
  });
});

test.describe("Responsive layout", () => {
  test("mobile navigation opens and links work", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile-only check");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const toggle = page.locator(".nav-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator("#nav-menu")).toHaveClass(/is-open/);
    await page.locator('#nav-menu a[href="#projects"]').click();
    await expect(page.locator("#projects")).toBeInViewport();
  });
});
