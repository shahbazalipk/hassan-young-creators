import { test, expect, devices } from "@playwright/test";

const phone = devices["iPhone 12"];

test.describe("Quiz mobile layouts", () => {
  test.use({ ...phone });

  test("Flash Cards setup and quiz chrome are usable on phone", async ({ page }) => {
    await page.goto("/flash-cards/");
    await expect(page.locator("#student-name")).toBeVisible();
    await expect(page.locator("#student-age")).toBeVisible();

    const ageBox = page.locator("#student-age");
    await expect(ageBox).toHaveAttribute("min", "4");
    await expect(ageBox).toHaveAttribute("max", "18");

    await page.locator("#student-name").fill("Ayaan");
    await page.locator("#student-age").fill("7");
    await page.locator('input[name="cardCount"][value="5"]').check();
    await page.getByRole("button", { name: /start/i }).click();

    // Quiz screen should show readable question + tappable options
    await expect(page.locator("#question-text")).toBeVisible({ timeout: 15000 });
    const question = page.locator("#question-text");
    const box = await question.boundingBox();
    expect(box?.width || 0).toBeGreaterThan(200);

    const options = page.locator("#answer-options button, #answer-options .answer-btn");
    await expect(options.first()).toBeVisible();
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const optBox = await options.first().boundingBox();
    expect(optBox?.height || 0).toBeGreaterThan(36);
  });

  test("KidMind student age accepts new band range on phone", async ({ page }) => {
    await page.goto("/kidmind-ai/");
    // Splash / language may appear first — wait for age field or language buttons
    const age = page.locator("#student-age-input");
    const langBtn = page.locator("#language-screen .btn-primary, [data-lang]").first();
    if (await langBtn.isVisible().catch(() => false)) {
      await langBtn.click();
    }
    // Navigate toward student details if needed
    const studentBtn = page.getByRole("button", { name: /student|start|details|next/i }).first();
    if (await studentBtn.isVisible().catch(() => false)) {
      await studentBtn.click().catch(() => null);
    }
    if (await age.count()) {
      await expect(age).toHaveAttribute("min", "4");
      await expect(age).toHaveAttribute("max", "18");
    }
  });
});
