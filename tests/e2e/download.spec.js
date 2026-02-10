// @ts-check
const { test, expect } = require("@playwright/test");

// Feature: Download calendar file

test.describe("Download calendar file", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Download button is disabled until selections are complete", async ({
    page,
  }) => {
    await expect(page.locator("#download-btn")).toBeDisabled();
  });

  test("Download button is enabled when route and waste types are selected", async ({
    page,
  }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();
    await expect(page.locator("#download-btn")).toBeEnabled();
    await expect(page.locator("#download-btn")).toContainText(
      "Last ned kalenderfil (.ics)",
    );
  });

  test("Downloading an ICS file for Rute 3", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      "Gjesdal Tømmekalender 2026 - Rute 3.ics",
    );

    // Verify toast
    await expect(page.locator(".toast")).toContainText(
      "Kalenderfilen er lastet ned!",
    );
  });

  test("Downloaded file name matches the selected route", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="1"]') })
      .click();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      "Gjesdal Tømmekalender 2026 - Rute 1.ics",
    );
  });

  test("Downloaded ICS file is valid", async ({ page }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download-btn").click();
    const download = await downloadPromise;

    const path = await download.path();
    const fs = require("fs");
    const content = fs.readFileSync(path, "utf-8");

    expect(content).toMatch(/^BEGIN:VCALENDAR/);
    expect(content.trimEnd()).toMatch(/END:VCALENDAR$/);
    expect(content).toContain("VERSION:2.0");
    expect(content).toContain("METHOD:PUBLISH");
    expect(content).toContain(
      "X-WR-CALNAME:Gjesdal Tømmekalender 2026 - Rute 3",
    );
  });

  test("Downloaded ICS file contains correct events for Matavfall only", async ({
    page,
  }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();

    // Select only Matavfall
    await page.locator("#select-none-waste").click();
    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="matavfall"]'),
      })
      .click();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download-btn").click();
    const download = await downloadPromise;

    const path = await download.path();
    const fs = require("fs");
    const content = fs.readFileSync(path, "utf-8");

    const events = content.match(/BEGIN:VEVENT/g);
    expect(events).toHaveLength(13);

    // All events should have DTSTART with TZID (timed events at 7am)
    const dtStartMatches = content.match(
      /DTSTART;TZID=Europe\/Oslo:\d{8}T070000/g,
    );
    expect(dtStartMatches).toHaveLength(13);

    // All UIDs should be unique
    const uids = content.match(/UID:.+/g) || [];
    expect(uids.length).toBeGreaterThan(0);
    const uniqueUids = new Set(uids);
    expect(uniqueUids.size).toBe(uids.length);
  });

  test("Downloaded ICS file includes alerts when configured", async ({
    page,
  }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();
    await page.locator("#select-none-waste").click();
    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="matavfall"]'),
      })
      .click();

    // Ensure "evening-before" alert is checked (default)
    await expect(
      page.locator('input[name="alert"][value="evening-before"]'),
    ).toBeChecked();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download-btn").click();
    const download = await downloadPromise;

    const path = await download.path();
    const fs = require("fs");
    const content = fs.readFileSync(path, "utf-8");

    const alarms = content.match(/BEGIN:VALARM/g);
    expect(alarms).toHaveLength(13); // One per event

    expect(content).toContain("TRIGGER:-PT10H");
  });

  test("Downloaded ICS file has no alerts when none configured", async ({
    page,
  }) => {
    await page
      .locator("label.route-option", { has: page.locator('input[value="3"]') })
      .click();
    await page.locator("#select-none-waste").click();
    await page
      .locator("label.waste-type-option", {
        has: page.locator('input[value="matavfall"]'),
      })
      .click();

    // Uncheck all alerts
    await page
      .locator("label.alert-option", {
        has: page.locator('input[value="evening-before"]'),
      })
      .click();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download-btn").click();
    const download = await downloadPromise;

    const path = await download.path();
    const fs = require("fs");
    const content = fs.readFileSync(path, "utf-8");

    expect(content).not.toContain("BEGIN:VALARM");
  });
});
