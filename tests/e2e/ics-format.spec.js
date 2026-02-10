// @ts-check
const { test, expect } = require("@playwright/test");

// Feature: ICS file format compliance
// These tests generate ICS via download and verify RFC 5545 compliance.

/**
 * Helper: select route, optionally specific waste types, optionally alerts, then download and return file content.
 * @param {import('@playwright/test').Page} page
 * @param {{ route?: number, wasteTypes?: string[], alerts?: string[] | "none" }} [options]
 * @returns {Promise<string>}
 */
async function downloadICSContent(page, { route, wasteTypes, alerts } = {}) {
  await page.goto("/");
  await page
    .locator("label.route-option", {
      has: page.locator(`input[value="${route || 3}"]`),
    })
    .click();

  if (wasteTypes) {
    await page.locator("#select-none-waste").click();
    for (const wt of wasteTypes) {
      await page
        .locator("label.waste-type-option", {
          has: page.locator(`input[value="${wt}"]`),
        })
        .click();
    }
  }

  if (alerts === "none") {
    // Uncheck all alerts
    const checkedAlerts = await page
      .locator('input[name="alert"]:checked')
      .evaluateAll((/** @type {HTMLInputElement[]} */ els) =>
        els.map((el) => el.value),
      );
    for (const val of checkedAlerts) {
      await page
        .locator("label.alert-option", {
          has: page.locator(`input[value="${val}"]`),
        })
        .click();
    }
  } else if (Array.isArray(alerts)) {
    // Uncheck all first
    const checkedAlerts = await page
      .locator('input[name="alert"]:checked')
      .evaluateAll((/** @type {HTMLInputElement[]} */ els) =>
        els.map((el) => el.value),
      );
    for (const val of checkedAlerts) {
      await page
        .locator("label.alert-option", {
          has: page.locator(`input[value="${val}"]`),
        })
        .click();
    }
    for (const a of alerts) {
      await page
        .locator("label.alert-option", {
          has: page.locator(`input[value="${a}"]`),
        })
        .click();
    }
  }

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-btn").click();
  const download = await downloadPromise;

  const path = await download.path();
  const fs = require("fs");
  return fs.readFileSync(path, "utf-8");
}

test.describe("ICS file format compliance", () => {
  test("ICS file structure - VCALENDAR wrapper and properties", async ({
    page,
  }) => {
    const content = await downloadICSContent(page, {
      route: 3,
      alerts: "none",
    });

    expect(content).toMatch(/^BEGIN:VCALENDAR/);
    expect(content.trimEnd()).toMatch(/END:VCALENDAR$/);
    expect(content).toContain("VERSION:2.0");
    expect(content).toContain("CALSCALE:GREGORIAN");
    expect(content).toContain("METHOD:PUBLISH");
    expect(content).toContain("X-WR-TIMEZONE:Europe/Oslo");
  });

  test("Calendar name matches route", async ({ page }) => {
    const content = await downloadICSContent(page, { route: 1 });
    expect(content).toContain(
      "X-WR-CALNAME:Gjesdal Tømmekalender 2026 - Rute 1",
    );
  });

  test("VEVENT properties for a specific event", async ({ page }) => {
    const content = await downloadICSContent(page, {
      route: 3,
      wasteTypes: ["matavfall"],
      alerts: "none",
    });

    expect(content).toContain("UID:gjesdal-r3-matavfall-2026-01-07@calendar");
    expect(content).toContain("DTSTART;TZID=Europe/Oslo:20260107T070000");
    expect(content).toContain("DURATION:PT1H");
    expect(content).toContain("SUMMARY:🍏 Matavfall");
    expect(content).toContain("DESCRIPTION:Matavfall tømmedag");

    // DTSTAMP should be UTC format (YYYYMMDDTHHMMSSZ)
    const dtstamp = content.match(/DTSTAMP:(\S+)/);
    expect(dtstamp).not.toBeNull();
    expect(dtstamp?.[1]).toMatch(/^\d{8}T\d{6}Z$/);
  });

  test("Events are sorted chronologically", async ({ page }) => {
    const content = await downloadICSContent(page, { route: 3 });

    const dtStarts = [
      ...content.matchAll(/DTSTART;TZID=Europe\/Oslo:(\d{8}T\d{6})/g),
    ].map((m) => m[1]);

    for (let i = 1; i < dtStarts.length; i++) {
      // String comparison works for ISO datetime format
      expect(dtStarts[i] >= dtStarts[i - 1]).toBe(true);
    }
  });

  test("UIDs are unique across all events", async ({ page }) => {
    const content = await downloadICSContent(page, { route: 3 });

    const uids = [...content.matchAll(/UID:(.+)/g)].map((m) => m[1].trim());
    const uniqueUids = new Set(uids);
    expect(uniqueUids.size).toBe(uids.length);
  });

  test("Timed events with DURATION", async ({ page }) => {
    const content = await downloadICSContent(page, {
      route: 3,
      wasteTypes: ["matavfall"],
      alerts: "none",
    });

    // Every VEVENT DTSTART should have TZID (timed event at 7am)
    // Use a more specific regex to avoid matching VTIMEZONE DTSTART
    const dtStarts =
      content.match(/DTSTART;TZID=Europe\/Oslo:\d{8}T\d{6}/g) || [];
    expect(dtStarts.length).toBeGreaterThan(0);
    for (const ds of dtStarts) {
      expect(ds).toMatch(/T070000/); // 7am time component
    }

    // Every event should have DURATION
    expect(content).toContain("DURATION:PT1H");
  });

  test("VALARM structure with evening-before alert", async ({ page }) => {
    const content = await downloadICSContent(page, {
      route: 3,
      wasteTypes: ["matavfall"],
      alerts: ["evening-before"],
    });

    expect(content).toContain("BEGIN:VALARM");
    expect(content).toContain("ACTION:DISPLAY");
    expect(content).toContain("TRIGGER:-PT10H");
    expect(content).toContain("DESCRIPTION:Matavfall henting");
    expect(content).toContain("END:VALARM");
  });

  test("Multiple alerts per event", async ({ page }) => {
    const content = await downloadICSContent(page, {
      route: 3,
      wasteTypes: ["matavfall"],
      alerts: ["evening-before", "morning-of"],
    });

    // 13 events × 2 alarms = 26 VALARM blocks
    const alarms = content.match(/BEGIN:VALARM/g);
    expect(alarms).toHaveLength(26);

    expect(content).toContain("TRIGGER:-PT10H");
    expect(content).toContain("TRIGGER:-PT0H");
  });

  test("PRODID includes calendar name", async ({ page }) => {
    const content = await downloadICSContent(page, { route: 3 });

    expect(content).toContain("Gjesdal Tømmekalender 2026 - Rute 3");
    expect(content).toMatch(/PRODID:.*Gjesdal/);
  });

  test("Line endings are CRLF", async ({ page }) => {
    const content = await downloadICSContent(page, {
      route: 3,
      wasteTypes: ["matavfall"],
      alerts: "none",
    });

    // Should contain \r\n
    expect(content).toContain("\r\n");

    // Should not have bare \n (without preceding \r)
    const bareNewlines = content.replace(/\r\n/g, "").match(/\n/g);
    expect(bareNewlines).toBeNull();
  });
});
