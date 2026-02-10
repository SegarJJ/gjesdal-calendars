// @ts-check
import { test, expect } from "@playwright/test";

// Feature: Route selection

test.describe("Route selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Page shows all four routes", async ({ page }) => {
    const radios = page.locator('input[name="route"]');
    await expect(radios).toHaveCount(4);

    for (const num of [1, 2, 3, 4]) {
      const radio = page.locator(`input[name="route"][value="${num}"]`);
      await expect(radio).toBeAttached();
      await expect(
        page.locator(`.route-option`, { has: radio }).locator(".route-label"),
      ).toHaveText(`Rute ${num}`);
    }
  });

  test("No route is selected by default", async ({ page }) => {
    const checked = page.locator('input[name="route"]:checked');
    await expect(checked).toHaveCount(0);

    await expect(page.locator("#download-btn")).toBeDisabled();
    await expect(page.locator("#preview-btn")).toBeDisabled();
  });

  test("Selecting a route", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();
    await expect(page.locator('input[name="route"][value="3"]')).toBeChecked();

    // Summary should update with event counts
    await expect(page.locator("#summary-content .summary-grid")).toBeVisible();
  });

  test("Changing the selected route", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();
    await expect(page.locator('input[name="route"][value="1"]')).toBeChecked();

    await page
      .locator("label.route-option", { has: page.locator('input[value="2"]') })
      .click();
    await expect(page.locator('input[name="route"][value="2"]')).toBeChecked();
    await expect(
      page.locator('input[name="route"][value="1"]'),
    ).not.toBeChecked();
  });

  test("Viewing route details", async ({ page }) => {
    await page.locator('.route-info-btn[data-route="3"]').click();

    const modal = page.locator(".route-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator(".route-modal-description")).not.toBeEmpty();
    await expect(modal.locator(".route-area-tag")).not.toHaveCount(0);
    await expect(modal.locator(".route-status-ok")).toBeVisible();
  });

  test("Closing the route details modal via close button", async ({ page }) => {
    await page.locator('.route-info-btn[data-route="3"]').click();
    await expect(page.locator(".route-modal")).toBeVisible();

    await page.locator(".route-modal-close").click();
    await expect(page.locator(".route-modal-overlay")).toHaveCount(0);
  });

  test("Closing the route details modal by clicking outside", async ({
    page,
  }) => {
    await page.locator('.route-info-btn[data-route="3"]').click();
    await expect(page.locator(".route-modal")).toBeVisible();

    // Click the overlay (outside the modal)
    await page
      .locator(".route-modal-overlay")
      .click({ position: { x: 5, y: 5 } });
    await expect(page.locator(".route-modal-overlay")).toHaveCount(0);
  });
});
