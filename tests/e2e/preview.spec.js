// @ts-check
const { test, expect } = require("@playwright/test");

// Feature: Preview calendar

test.describe("Preview calendar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Preview button is disabled until selections are complete", async ({
    page,
  }) => {
    await expect(page.locator("#preview-btn")).toBeDisabled();
  });

  test("Preview button is enabled when route and waste types are selected", async ({
    page,
  }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();
    await expect(page.locator("#preview-btn")).toBeEnabled();
    await expect(page.locator("#preview-btn")).toContainText("Forhåndsvisning");
  });

  test("Opening the preview panel", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();
    await page.locator("#preview-btn").click();

    const panel = page.locator("#preview-panel");
    await expect(panel).toHaveClass(/visible/);

    // Should have a heading with upcoming event count
    await expect(panel.locator("h3")).toContainText("Kommende hendelser");

    // Should list events
    await expect(panel.locator(".preview-event")).not.toHaveCount(0);
  });

  test("Preview shows event details", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();
    await page.locator("#preview-btn").click();

    const firstEvent = page.locator(".preview-event").first();
    await expect(firstEvent.locator(".preview-date")).not.toBeEmpty();
    await expect(firstEvent.locator(".preview-type")).not.toBeEmpty();

    // Should have a coloured left border (style attribute or CSS)
    const borderColor = await firstEvent.evaluate(
      (el) => getComputedStyle(el).borderLeftColor,
    );
    expect(borderColor).not.toBe("");
  });

  test("Preview limits displayed events to 20", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();
    await page.locator("#preview-btn").click();

    const events = page.locator(".preview-event");
    const count = await events.count();
    expect(count).toBeLessThanOrEqual(20);

    // If there are more upcoming events, a "more" message should appear
    const moreMsg = page.locator(".preview-more");
    // This is conditional — only shown if > 20 upcoming events exist
    if (count === 20) {
      await expect(moreMsg).toBeVisible();
    }
  });

  test("Preview indicates past events", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();
    await page.locator("#preview-btn").click();

    // As of Feb 2026, some Rute 3 dates (Jan 2026) have passed
    const pastMsg = page.locator(".preview-past");
    await expect(pastMsg).toBeVisible();
    await expect(pastMsg).toContainText("passert");
  });

  test("Preview shows raw ICS content", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();
    await page.locator("#preview-btn").click();

    const details = page.locator(".preview-raw");
    await expect(details).toBeVisible();
    await expect(details.locator("summary")).toContainText("Vis rå ICS-fil");

    // Expand it
    await details.locator("summary").click();
    const code = details.locator("pre code");
    await expect(code).toBeVisible();
    await expect(code).toContainText("BEGIN:VCALENDAR");
  });

  test("Toggling the preview panel closed", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    // Open
    await page.locator("#preview-btn").click();
    await expect(page.locator("#preview-panel")).toHaveClass(/visible/);

    // Close
    await page.locator("#preview-btn").click();
    await expect(page.locator("#preview-panel")).not.toHaveClass(/visible/);
  });
});
