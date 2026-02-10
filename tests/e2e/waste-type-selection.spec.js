// @ts-check
const { test, expect } = require("@playwright/test");

// Feature: Waste type selection

test.describe("Waste type selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("All waste types are shown", async ({ page }) => {
    const checkboxes = page.locator('input[name="wasteType"]');
    await expect(checkboxes).toHaveCount(4);

    const expected = [
      { id: "matavfall", name: "Matavfall" },
      { id: "restavfall", name: "Restavfall/Bleiedunk" },
      { id: "papir", name: "Papp/Papir" },
      { id: "glass", name: "Glass/Metalemballasje" },
    ];

    for (const wt of expected) {
      const checkbox = page.locator(
        `input[name="wasteType"][value="${wt.id}"]`,
      );
      await expect(checkbox).toBeAttached();
      await expect(
        page
          .locator(".waste-type-option", { has: checkbox })
          .locator(".waste-name"),
      ).toHaveText(wt.name);
    }
  });

  test("All waste types are selected by default", async ({ page }) => {
    const checkboxes = page.locator('input[name="wasteType"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test("Deselecting a waste type", async ({ page }) => {
    // Select a route first so summary is active
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="matavfall"]'),
      })
      .click();
    await expect(
      page.locator('input[name="wasteType"][value="matavfall"]'),
    ).not.toBeChecked();

    // Summary should not include Matavfall
    await expect(page.locator("#summary-content")).not.toContainText(
      "Matavfall",
    );
  });

  test("Selecting a previously deselected waste type", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="papir"]'),
      })
      .click();
    await expect(
      page.locator('input[name="wasteType"][value="papir"]'),
    ).not.toBeChecked();

    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="papir"]'),
      })
      .click();
    await expect(
      page.locator('input[name="wasteType"][value="papir"]'),
    ).toBeChecked();

    await expect(page.locator("#summary-content")).toContainText("Papp/Papir");
  });

  test("Select all waste types", async ({ page }) => {
    // Uncheck some first
    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="matavfall"]'),
      })
      .click();
    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="restavfall"]'),
      })
      .click();

    await page.locator("#select-all-waste").click();

    const checkboxes = page.locator('input[name="wasteType"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test("Select no waste types", async ({ page }) => {
    await page.locator("#select-none-waste").click();

    const checkboxes = page.locator('input[name="wasteType"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked();
    }

    await expect(page.locator("#download-btn")).toBeDisabled();
    await expect(page.locator("#preview-btn")).toBeDisabled();
  });

  test("At least one waste type is required for download", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();
    await page.locator("#select-none-waste").click();

    await expect(page.locator("#download-btn")).toBeDisabled();
    await expect(page.locator("#summary-content")).toContainText(
      "Velg rute og avfallstyper",
    );
  });
});
