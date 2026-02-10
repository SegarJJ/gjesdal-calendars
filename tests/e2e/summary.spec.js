// @ts-check
const { test, expect } = require("@playwright/test");

// Feature: Calendar summary

test.describe("Calendar summary", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Summary is empty when no route is selected", async ({ page }) => {
    await expect(page.locator("#summary-content")).toContainText(
      "Velg rute og avfallstyper for å se en oppsummering",
    );
  });

  test("Summary updates when route and waste types are selected", async ({
    page,
  }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    // All waste types are checked by default
    await expect(page.locator("#summary-content .summary-grid")).toBeVisible();
    await expect(
      page.locator("#summary-content .summary-breakdown"),
    ).toBeVisible();
    await expect(
      page.locator("#summary-content .summary-alerts"),
    ).toBeVisible();
  });

  test("Summary shows correct counts for Rute 3 with all waste types", async ({
    page,
  }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    // Total events: 13 + 26 + 13 + 5 = 57
    await expect(
      page.locator("#summary-content .stat-number").first(),
    ).toHaveText("57");

    // Verify per-type breakdown
    const types = page.locator("#summary-content .summary-type");
    await expect(types).toHaveCount(4);

    const expectedCounts = [
      { name: "Matavfall", count: "13" },
      { name: "Restavfall/Bleiedunk", count: "26" },
      { name: "Papp/Papir", count: "13" },
      { name: "Glass/Metallemballasje", count: "5" },
    ];

    for (const expected of expectedCounts) {
      const typeRow = types.filter({ hasText: expected.name });
      await expect(typeRow.locator(".type-count")).toContainText(
        `${expected.count} dager`,
      );
    }
  });

  test("Summary updates when waste types change", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    // Uncheck glass (5 events) → 57 - 5 = 52
    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="glass"]'),
      })
      .click();

    await expect(
      page.locator("#summary-content .stat-number").first(),
    ).toHaveText("52");
  });

  test("Summary shows alert configuration", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();

    // Default alert "evening-before" is checked
    await expect(
      page.locator("#summary-content .summary-alerts"),
    ).toContainText("Kl. 21 kvelden før");
  });
});
