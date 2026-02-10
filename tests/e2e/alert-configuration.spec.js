// @ts-check
import { test, expect } from "@playwright/test";

// Feature: Alert / reminder configuration

test.describe("Alert configuration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Available alert presets are shown", async ({ page }) => {
    const checkboxes = page.locator('input[name="alert"]');
    await expect(checkboxes).toHaveCount(3);

    const expected = [
      { id: "evening-before", label: "Kl. 21 kvelden før" },
      { id: "afternoon-before", label: "Kl. 17 ettermiddagen før" },
      { id: "morning-of", label: "Kl. 07 tømmedagen" },
    ];

    for (const preset of expected) {
      const checkbox = page.locator(
        `input[name="alert"][value="${preset.id}"]`,
      );
      await expect(checkbox).toBeAttached();
      await expect(
        page
          .locator(".alert-option", { has: checkbox })
          .locator(".alert-label"),
      ).toHaveText(preset.label);
    }
  });

  test('Default alert is "Kvelden før"', async ({ page }) => {
    await expect(
      page.locator('input[name="alert"][value="evening-before"]'),
    ).toBeChecked();
  });

  test("Selecting multiple alerts", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();

    // "evening-before" is checked by default
    await expect(
      page.locator('input[name="alert"][value="evening-before"]'),
    ).toBeChecked();

    await page
      .locator("label.alert-option", {
        has: page.locator('input[value="morning-of"]'),
      })
      .click();
    await expect(
      page.locator('input[name="alert"][value="morning-of"]'),
    ).toBeChecked();

    // Summary should show 2 reminders
    await expect(
      page.locator("#summary-content .stat-number").nth(1),
    ).toHaveText("2");
  });

  test("Deselecting all alerts", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();

    // Uncheck the default
    await page
      .locator("label.alert-option", {
        has: page.locator('input[value="evening-before"]'),
      })
      .click();

    const checkboxes = page.locator('input[name="alert"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked();
    }

    await expect(
      page.locator("#summary-content .summary-alerts"),
    ).toContainText("Ingen påminnelser");
  });

  test("Alerts are optional - buttons stay enabled", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();

    // Uncheck default alert
    await page
      .locator("label.alert-option", {
        has: page.locator('input[value="evening-before"]'),
      })
      .click();

    await expect(page.locator("#download-btn")).toBeEnabled();
    await expect(page.locator("#preview-btn")).toBeEnabled();
  });
});
