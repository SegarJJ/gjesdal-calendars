/**
 * Gjesdal Tømmekalender - ICS File Generator
 *
 * Generates RFC 5545 compliant iCalendar (.ics) files from the
 * schedule data and user-configured alert preferences.
 */

import { WASTE_TYPES, ROUTES, ALERT_PRESETS } from "./calendar-data.js";

/**
 * Format a Date as an ICS DATE value: YYYYMMDD
 */
function formatICSDate(dateStr) {
  return dateStr.replace(/-/g, "");
}

/**
 * Format a Date as an ICS DATETIME value: YYYYMMDDTHHMMSS
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @param {string} time - Time in HH:MM:SS format
 * @returns {string} ICS datetime format
 */
function formatICSDateTime(dateStr, time = "07:00:00") {
  const dateOnly = dateStr.replace(/-/g, "");
  const timeOnly = time.replace(/:/g, "");
  return `${dateOnly}T${timeOnly}`;
}

/**
 * Generate a UTC timestamp for DTSTAMP in ICS format.
 */
function nowUTC() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Fold long lines per RFC 5545 (max 75 octets per line).
 */
function foldLine(line) {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  let result = line.substring(0, maxLen);
  let pos = maxLen;
  while (pos < line.length) {
    result += "\r\n " + line.substring(pos, pos + maxLen - 1);
    pos += maxLen - 1;
  }
  return result;
}

/**
 * Build VALARM blocks for a single event.
 *
 * @param {string} summary - Event summary text for alarm DESCRIPTION
 * @param {Array<{duration: string, label: string}>} alerts - Selected alert configs
 * @returns {string} One or more VALARM blocks
 */
function buildAlarms(summary, alerts) {
  return alerts
    .map(
      (alert) =>
        `BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-${alert.duration}\r\nDESCRIPTION:${summary}\r\nEND:VALARM`,
    )
    .join("\r\n");
}

/**
 * Build a single VEVENT block.
 */
function buildEvent(dateStr, wasteType, alerts, dtstamp, routeNum) {
  const uid = `gjesdal-r${routeNum}-${wasteType.id}-${dateStr}@calendar`;
  const summary = `${wasteType.icon} ${wasteType.name}`;

  // Set description based on waste type
  let description;
  if (wasteType.id === "restavfall") {
    description = `Restavfall/Bleiedunk tømmedag\\n\\nEkstrasekk til restavfall:\\nVipps kr. 65 til 835115.\\nSkriv «Avfallssekk» på gjennomsiktig\\nsøppelsekk og sett sekken ved restavfallsdunken.`;
  } else if (wasteType.id === "matavfall") {
    description = `Matavfall tømmedag\\n\\nTrenger du nye poser til matavfallet?\\nKnyt en pose på dunken din, så vil renovasjonen legge igjen ny rull til deg.\\nPoser kan også hentes på Veveriet.`;
  } else {
    description = `${wasteType.name} tømmedag`;
  }

  const alarmBlocks = alerts
    .map((alert) => buildAlarms(`${wasteType.name} henting`, [alert]))
    .join("\r\n");

  const eventLines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Oslo:${formatICSDateTime(dateStr, "07:00:00")}`,
    `DURATION:PT1H`,
    foldLine(`SUMMARY:${summary}`),
    foldLine(`DESCRIPTION:${description}`),
  ];

  if (alarmBlocks) {
    eventLines.push(alarmBlocks);
  }

  eventLines.push("END:VEVENT");

  return eventLines.join("\r\n");
}

/**
 * Generate a complete ICS file string.
 *
 * @param {Object} options
 * @param {number} options.route - Route number
 * @param {string[]} options.wasteTypeIds - Which waste types to include
 * @param {Array<{duration: string, label: string}>} options.alerts - Alert configurations
 * @returns {string} Complete ICS file content
 */
export function generateICS({ route, wasteTypeIds, alerts }) {
  const routeData = ROUTES[route];
  if (!routeData) {
    throw new Error(`Route ${route} not found`);
  }

  const dtstamp = nowUTC();
  const events = [];

  for (const typeId of wasteTypeIds) {
    const wasteType = WASTE_TYPES[typeId];
    const dates = routeData.schedule[typeId];
    if (!wasteType || !dates) continue;

    for (const dateStr of dates) {
      events.push({
        date: dateStr,
        text: buildEvent(dateStr, wasteType, alerts, dtstamp, route),
      });
    }
  }

  // Sort events chronologically by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  const calName = `Gjesdal Tømmekalender 2026 - ${routeData.name}`;

  // VTIMEZONE component for Europe/Oslo
  const vtimezone = [
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Oslo",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ].join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${calName}//NO`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${calName}`),
    "X-WR-TIMEZONE:Europe/Oslo",
    vtimezone,
    events.map((e) => e.text).join("\r\n"),
    "END:VCALENDAR",
  ].join("\r\n");

  return ics;
}

/**
 * Trigger a file download in the browser.
 *
 * @param {string} icsContent - The ICS file content
 * @param {string} filename - Desired filename
 */
export function downloadICS(icsContent, filename) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Get a summary of what the generated calendar will contain.
 *
 * @param {Object} options - Same options as generateICS
 * @returns {Object} Summary with event counts per waste type and total
 */
export function getCalendarSummary({ route, wasteTypeIds }) {
  const routeData = ROUTES[route];
  if (!routeData) return null;

  const summary = { total: 0, types: [] };

  for (const typeId of wasteTypeIds) {
    const wasteType = WASTE_TYPES[typeId];
    const dates = routeData.schedule[typeId];
    if (!wasteType || !dates) continue;

    summary.types.push({
      id: typeId,
      name: wasteType.name,
      icon: wasteType.icon,
      count: dates.length,
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
    });
    summary.total += dates.length;
  }

  return summary;
}
