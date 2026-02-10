// @ts-check
import { test, expect } from "@playwright/test";
import ICAL from "ical.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import for ES modules
let generateICS, getCalendarSummary;
let WASTE_TYPES, ROUTES, ALERT_PRESETS;

test.beforeAll(async () => {
  const icsModulePath = resolve(__dirname, "../../src/ics-generator.js");
  const dataModulePath = resolve(__dirname, "../../src/calendar-data.js");

  const icsModule = await import(`file://${icsModulePath}`);
  const dataModule = await import(`file://${dataModulePath}`);

  generateICS = icsModule.generateICS;
  getCalendarSummary = icsModule.getCalendarSummary;
  WASTE_TYPES = dataModule.WASTE_TYPES;
  ROUTES = dataModule.ROUTES;
  ALERT_PRESETS = dataModule.ALERT_PRESETS;
});

test.describe("ICS Generator - Unit Tests", () => {
  test("generates valid RFC 5545 compliant ICS file", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    // Parse with ical.js - will throw if invalid
    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);

    expect(comp.name).toBe("vcalendar");
    expect(comp.getFirstPropertyValue("version")).toBe("2.0");
  });

  test("includes correct VCALENDAR properties", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    expect(icsContent).toContain("BEGIN:VCALENDAR");
    expect(icsContent).toContain("VERSION:2.0");
    expect(icsContent).toContain("CALSCALE:GREGORIAN");
    expect(icsContent).toContain("METHOD:PUBLISH");
    expect(icsContent).toContain(
      "PRODID:-//Gjesdal Tømmekalender 2026 - Rute 3//NO",
    );
    expect(icsContent).toContain("END:VCALENDAR");
  });

  test("includes VTIMEZONE for Europe/Oslo", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    expect(icsContent).toContain("BEGIN:VTIMEZONE");
    expect(icsContent).toContain("TZID:Europe/Oslo");
    expect(icsContent).toContain("END:VTIMEZONE");
  });

  test("generates correct number of events for matavfall", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    const events = icsContent.match(/BEGIN:VEVENT/g);
    expect(events).toHaveLength(13); // Rute 3 has 13 matavfall dates
  });

  test("generates events for multiple waste types", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall", "restavfall"],
      alerts: [],
    });

    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    // Rute 3: 13 matavfall + 26 restavfall = 39 total
    expect(vevents.length).toBe(39);
  });

  test("each VEVENT has required properties", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    vevents.forEach((event) => {
      expect(event.getFirstPropertyValue("uid")).toBeTruthy();
      expect(event.getFirstPropertyValue("dtstamp")).toBeTruthy();
      expect(event.getFirstPropertyValue("dtstart")).toBeTruthy();
      expect(event.getFirstPropertyValue("summary")).toBeTruthy();
      expect(event.getFirstPropertyValue("description")).toBeTruthy();
    });
  });

  test("events are timed events at 7am with DURATION", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    // Check for DTSTART with TZID (timed event)
    const dtStarts = icsContent.match(
      /DTSTART;TZID=Europe\/Oslo:\d{8}T070000/g,
    );
    expect(dtStarts).toHaveLength(13);

    // Check for DURATION
    const durations = icsContent.match(/DURATION:PT1H/g);
    expect(durations).toHaveLength(13);
  });

  test("events are sorted chronologically", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall", "restavfall", "papir", "glass"],
      alerts: [],
    });

    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    for (let i = 1; i < vevents.length; i++) {
      const prevDate = vevents[i - 1]
        .getFirstPropertyValue("dtstart")
        .toString();
      const currDate = vevents[i].getFirstPropertyValue("dtstart").toString();
      expect(currDate >= prevDate).toBe(true);
    }
  });

  test("UIDs are unique across all events", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall", "restavfall", "papir", "glass"],
      alerts: [],
    });

    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const uids = vevents.map((e) => e.getFirstPropertyValue("uid"));
    const uniqueUids = new Set(uids);
    expect(uniqueUids.size).toBe(uids.length);
  });

  test("matavfall has correct description", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    expect(icsContent).toContain("Matavfall tømmedag");
    expect(icsContent).toContain("Trenger du nye poser til matavfallet?");
    expect(icsContent).toContain("Poser kan også hentes på Veveriet");
  });

  test("restavfall has correct description", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["restavfall"],
      alerts: [],
    });

    expect(icsContent).toContain("Restavfall/Bleiedunk tømmedag");
    expect(icsContent).toContain("Ekstrasekk til restavfall");
    expect(icsContent).toContain("835115");
  });

  test("includes VALARM when alerts are configured", () => {
    const eveningBefore = ALERT_PRESETS.find((p) => p.id === "evening-before");
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [eveningBefore],
    });

    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    // Each event should have one alarm
    vevents.forEach((event) => {
      const valarms = event.getAllSubcomponents("valarm");
      expect(valarms.length).toBe(1);

      const alarm = valarms[0];
      expect(alarm.getFirstPropertyValue("action")).toBe("DISPLAY");
      expect(alarm.getFirstPropertyValue("trigger").toString()).toBe("-PT10H");
    });
  });

  test("includes multiple VALARMs when multiple alerts configured", () => {
    const eveningBefore = ALERT_PRESETS.find((p) => p.id === "evening-before");
    const morningOf = ALERT_PRESETS.find((p) => p.id === "morning-of");

    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [eveningBefore, morningOf],
    });

    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    // Each event should have two alarms
    vevents.forEach((event) => {
      const valarms = event.getAllSubcomponents("valarm");
      expect(valarms.length).toBe(2);
    });
  });

  test("no VALARMs when alerts array is empty", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    vevents.forEach((event) => {
      const valarms = event.getAllSubcomponents("valarm");
      expect(valarms.length).toBe(0);
    });
  });

  test("getCalendarSummary returns correct event counts", () => {
    const summary = getCalendarSummary({
      route: 3,
      wasteTypeIds: ["matavfall", "restavfall"],
    });

    expect(summary.total).toBe(39); // 13 + 26
    expect(summary.types).toHaveLength(2);
    expect(summary.types[0].id).toBe("matavfall");
    expect(summary.types[0].count).toBe(13);
    expect(summary.types[1].id).toBe("restavfall");
    expect(summary.types[1].count).toBe(26);
  });

  test("generates valid ICS for all waste types on Route 3", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall", "restavfall", "papir", "glass"],
      alerts: [],
    });

    // Should parse without errors
    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    expect(vevents.length).toBeGreaterThan(0);
  });

  test("line endings are CRLF", () => {
    const icsContent = generateICS({
      route: 3,
      wasteTypeIds: ["matavfall"],
      alerts: [],
    });

    // ICS files should use CRLF line endings
    expect(icsContent).toContain("\r\n");
    // Lines should not have just LF
    expect(icsContent.split("\r\n").length).toBeGreaterThan(
      icsContent.split("\n").length - icsContent.split("\r\n").length,
    );
  });
});
