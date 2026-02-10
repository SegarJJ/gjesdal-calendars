/**
 * Gjesdal Tømmekalender - Application Controller
 *
 * Handles UI interactions, form state, preview, and download.
 */

import { WASTE_TYPES, ROUTES, ALERT_PRESETS } from "./calendar-data.js";
import {
  generateICS,
  downloadICS,
  getCalendarSummary,
} from "./ics-generator.js";

// ── State ──────────────────────────────────────────────────────────────

const state = {
  route: null,
  wasteTypes: new Set(),
  alerts: [],
};

// ── DOM helpers ────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ── Initialisation ─────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderRouteSelector();
  renderWasteTypeSelector();
  renderAlertOptions();
  bindEvents();
  updateUI();
});

// ── Route selector ─────────────────────────────────────────────────────

function renderRouteSelector() {
  const container = $("#route-options");
  const routeNums = Object.keys(ROUTES).map(Number).sort();

  container.innerHTML = routeNums
    .map((num) => {
      const route = ROUTES[num];
      const areasText = route.areas ? route.areas.join(", ") : "";
      return `
      <div class="route-wrapper">
        <label class="route-option">
          <input type="radio" name="route" value="${num}">
          <span class="route-card">
            <span class="route-number">${num}</span>
            <span class="route-info">
              <span class="route-label">${route.name}</span>
              <span class="route-areas">${areasText}</span>
            </span>
          </span>
        </label>
        <button class="route-info-btn" data-route="${num}" title="Vis detaljer for ${route.name}">ℹ️</button>
      </div>`;
    })
    .join("");

  // Route info button click
  container.addEventListener("click", (e) => {
    const infoBtn = e.target.closest(".route-info-btn");
    if (infoBtn) {
      e.preventDefault();
      const routeNum = Number(infoBtn.dataset.route);
      showRouteDetails(routeNum);
    }
  });
}

// ── Route details modal ────────────────────────────────────────────────

function showRouteDetails(routeNum) {
  const route = ROUTES[routeNum];
  if (!route) return;

  // Remove any existing modal
  const existing = $(".route-modal-overlay");
  if (existing) existing.remove();

  const hasData = Object.values(route.schedule).some(
    (dates) => dates.length > 0,
  );
  const totalEvents = Object.values(route.schedule).reduce(
    (sum, dates) => sum + dates.length,
    0,
  );

  const overlay = document.createElement("div");
  overlay.className = "route-modal-overlay";
  overlay.innerHTML = `
    <div class="route-modal">
      <button class="route-modal-close" aria-label="Lukk">&times;</button>
      <h2>${route.name}</h2>
      <div class="route-modal-description">${route.description}</div>
      ${
        route.areas
          ? `
        <div class="route-modal-areas">
          <strong>Områder:</strong>
          <div class="route-area-tags">
            ${route.areas.map((a) => `<span class="route-area-tag">${a}</span>`).join("")}
          </div>
        </div>
      `
          : ""
      }
      <div class="route-modal-status">
        ${
          hasData
            ? `<span class="route-status-ok">✅ Kalenderdata tilgjengelig (${totalEvents} hendelser)</span>`
            : '<span class="route-status-pending">⏳ Kalenderdata kommer snart</span>'
        }
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("visible"));

  // Close handlers
  overlay
    .querySelector(".route-modal-close")
    .addEventListener("click", () => closeRouteModal(overlay));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeRouteModal(overlay);
  });
}

function closeRouteModal(overlay) {
  overlay.classList.remove("visible");
  setTimeout(() => overlay.remove(), 200);
}

// ── Waste type selector ────────────────────────────────────────────────

function renderWasteTypeSelector() {
  const container = $("#waste-type-options");

  container.innerHTML = Object.values(WASTE_TYPES)
    .map(
      (wt) => `
      <label class="waste-type-option" style="--waste-color: ${wt.color}">
        <input type="checkbox" name="wasteType" value="${wt.id}" checked>
        <span class="waste-card">
          <span class="waste-checkbox"></span>
          <span class="waste-icon">${wt.icon}</span>
          <span class="waste-info">
            <span class="waste-name">${wt.name}</span>
            <span class="waste-desc">${wt.description}</span>
          </span>
        </span>
      </label>`,
    )
    .join("");

  // Pre-select all
  Object.keys(WASTE_TYPES).forEach((id) => state.wasteTypes.add(id));
}

// ── Alert options ──────────────────────────────────────────────────────

function renderAlertOptions() {
  const container = $("#alert-options");

  container.innerHTML = ALERT_PRESETS.map(
    (preset) => `
    <label class="alert-option">
      <input type="checkbox" name="alert" value="${preset.id}">
      <span class="alert-card">
        <span class="alert-label">${preset.label}</span>
        <span class="alert-desc">${preset.description}</span>
      </span>
    </label>`,
  ).join("");

  // Default: select "evening before"
  const defaultAlert = container.querySelector('input[value="evening-before"]');
  if (defaultAlert) {
    defaultAlert.checked = true;
    state.alerts = [ALERT_PRESETS.find((p) => p.id === "evening-before")];
  }
}

// ── Event binding ──────────────────────────────────────────────────────

function bindEvents() {
  // Route selection
  $("#route-options").addEventListener("change", (e) => {
    if (e.target.name === "route") {
      state.route = Number(e.target.value);
      updateUI();
    }
  });

  // Waste type selection
  $("#waste-type-options").addEventListener("change", (e) => {
    if (e.target.name === "wasteType") {
      if (e.target.checked) {
        state.wasteTypes.add(e.target.value);
      } else {
        state.wasteTypes.delete(e.target.value);
      }
      updateUI();
    }
  });

  // Select all / none waste types
  $("#select-all-waste").addEventListener("click", () => {
    $$('input[name="wasteType"]').forEach((cb) => (cb.checked = true));
    Object.keys(WASTE_TYPES).forEach((id) => state.wasteTypes.add(id));
    updateUI();
  });

  $("#select-none-waste").addEventListener("click", () => {
    $$('input[name="wasteType"]').forEach((cb) => (cb.checked = false));
    state.wasteTypes.clear();
    updateUI();
  });

  // Alert selection
  $("#alert-options").addEventListener("change", (e) => {
    if (e.target.name === "alert") {
      state.alerts = $$('input[name="alert"]:checked').map((cb) =>
        ALERT_PRESETS.find((p) => p.id === cb.value),
      );
      updateUI();
    }
  });

  // Download button
  $("#download-btn").addEventListener("click", handleDownload);

  // Preview toggle
  $("#preview-btn").addEventListener("click", handlePreview);
}

// ── UI update ──────────────────────────────────────────────────────────

function updateUI() {
  const isValid = state.route && state.wasteTypes.size > 0;
  $("#download-btn").disabled = !isValid;
  $("#preview-btn").disabled = !isValid;

  updateSummary();
  updateStepIndicators();
}

function updateStepIndicators() {
  // Step 1: route
  const step1 = $("#step-1");
  step1.classList.toggle("completed", state.route !== null);

  // Step 2: waste types
  const step2 = $("#step-2");
  step2.classList.toggle("completed", state.wasteTypes.size > 0);

  // Step 3: alerts (always "completed" since zero alerts is valid)
  const step3 = $("#step-3");
  step3.classList.toggle("completed", true);
}

function updateSummary() {
  const container = $("#summary-content");

  if (!state.route || state.wasteTypes.size === 0) {
    container.innerHTML =
      '<p class="summary-empty">Velg rute og avfallstyper for å se en oppsummering.</p>';
    return;
  }

  const summary = getCalendarSummary({
    route: state.route,
    wasteTypeIds: [...state.wasteTypes],
  });

  if (!summary) {
    container.innerHTML =
      '<p class="summary-empty">Kunne ikke laste kalenderdata.</p>';
    return;
  }

  const alertDesc =
    state.alerts.length === 0
      ? '<span class="no-alerts">Ingen påminnelser</span>'
      : state.alerts.map((a) => a.label).join(", ");

  container.innerHTML = `
    <div class="summary-grid">
      <div class="summary-stat">
        <span class="stat-number">${summary.total}</span>
        <span class="stat-label">hendelser totalt</span>
      </div>
      <div class="summary-stat">
        <span class="stat-number">${state.alerts.length}</span>
        <span class="stat-label">påminnelser per hendelse</span>
      </div>
    </div>
    <div class="summary-breakdown">
      ${summary.types
        .map(
          (t) => `
        <div class="summary-type">
          <span class="type-icon">${t.icon}</span>
          <span class="type-name">${t.name}</span>
          <span class="type-count">${t.count} dager</span>
        </div>`,
        )
        .join("")}
    </div>
    <div class="summary-alerts">
      <strong>Påminnelser:</strong> ${alertDesc}
    </div>
  `;
}

// ── Download handler ───────────────────────────────────────────────────

function handleDownload() {
  if (!state.route || state.wasteTypes.size === 0) return;

  try {
    const icsContent = generateICS({
      route: state.route,
      wasteTypeIds: [...state.wasteTypes],
      alerts: state.alerts,
    });

    const routeData = ROUTES[state.route];
    const filename = `Gjesdal Tømmekalender ${routeData.year} - ${routeData.name}.ics`;

    downloadICS(icsContent, filename);

    showToast("Kalenderfilen er lastet ned! 📅");
  } catch (err) {
    console.error("Download failed:", err);
    showToast("Noe gikk galt. Prøv igjen.", "error");
  }
}

// ── Preview handler ────────────────────────────────────────────────────

function handlePreview() {
  if (!state.route || state.wasteTypes.size === 0) return;

  const previewPanel = $("#preview-panel");
  const previewContent = $("#preview-content");

  if (previewPanel.classList.contains("visible")) {
    previewPanel.classList.remove("visible");
    return;
  }

  const icsContent = generateICS({
    route: state.route,
    wasteTypeIds: [...state.wasteTypes],
    alerts: state.alerts,
  });

  // Show upcoming events in a friendlier format
  const routeData = ROUTES[state.route];
  const allEvents = [];

  for (const typeId of state.wasteTypes) {
    const wt = WASTE_TYPES[typeId];
    const dates = routeData.schedule[typeId] || [];
    for (const d of dates) {
      allEvents.push({ date: d, type: wt });
    }
  }

  allEvents.sort((a, b) => a.date.localeCompare(b.date));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = allEvents.filter((e) => e.date >= today);
  const past = allEvents.filter((e) => e.date < today);

  const formatDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    const days = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "mai",
      "jun",
      "jul",
      "aug",
      "sep",
      "okt",
      "nov",
      "des",
    ];
    return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]}`;
  };

  previewContent.innerHTML = `
    <h3>Kommende hendelser (${upcoming.length})</h3>
    <div class="preview-events">
      ${upcoming
        .slice(0, 20)
        .map(
          (e) => `
        <div class="preview-event" style="border-left-color: ${e.type.color}">
          <span class="preview-date">${formatDate(e.date)}</span>
          <span class="preview-type">${e.type.icon} ${e.type.name}</span>
        </div>`,
        )
        .join("")}
      ${upcoming.length > 20 ? `<p class="preview-more">...og ${upcoming.length - 20} flere hendelser</p>` : ""}
    </div>
    ${past.length > 0 ? `<p class="preview-past">${past.length} hendelser er allerede passert og inkluderes i filen.</p>` : ""}
    <details class="preview-raw">
      <summary>Vis rå ICS-fil</summary>
      <pre><code>${escapeHtml(icsContent)}</code></pre>
    </details>
  `;

  previewPanel.classList.add("visible");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Toast notification ─────────────────────────────────────────────────

function showToast(message, type = "success") {
  const existing = $(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
