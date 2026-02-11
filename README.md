# ♻️ Gjesdal Tømmekalender 2026

A web app that lets residents of Gjesdal municipality (Norway) generate personalised iCalendar (`.ics`) files for their waste collection schedule.

Users pick their route (Rute 1–4), choose which waste types to include (matavfall, restavfall, papp/papir, glass/metall), optionally add reminder alerts, and download a `.ics` file they can import into Apple Calendar, Google Calendar, Outlook or any other calendar app.

## Try it out

View this url on your phone https://segarjj.github.io/gjesdal-calendars/ and select your route, your pickups, and your alerts.  The tool will give you a preview of the calendar events that will be built into the .ics file of your design.  Your phone will guide you through the rest of the steps to add the events to your own calendar on your mobile device.

## Project structure

```
index.html              Main single-page application
src/
  app.js                UI logic and interaction handling
  calendar-data.js      Route schedules and waste-type definitions
  ics-generator.js      RFC 5545 compliant .ics file generator
  styles.css            Stylesheet
input/
  rute1–4.csv           Extracted collection dates per route
  Tømmekalender *.pdf   Original PDF calendars from the municipality
features/
  *.feature             Gherkin specs defining expected behaviour
tests/e2e/
  *.spec.js             Playwright end-to-end tests
output/
  *.ics                 Pre-generated calendar files
```

## Data pipeline

The original waste collection dates were extracted from the municipality's PDF calendars (in `input/`) using Python (PyMuPDF / Pillow / NumPy), exported to CSV (in `input/`), and then embedded into `src/calendar-data.js` for use by the web app.

## Prerequisites

- Docker (or a compatible container runtime)
- Visual Studio Code with the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension

## Getting started with the dev container

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd gjesdal-calendars
   ```

2. **Open the folder in VS Code:**

   ```bash
   code .
   ```

3. **Reopen in Container** — click the prompt when it appears, or open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run *Dev Containers: Reopen in Container*.

4. The dev container will automatically:
   - Install Python 3.12 and Node.js (LTS)
   - Install Python packages: `pymupdf`, `Pillow`, `numpy`
   - Install `browser-sync` globally via npm

5. Once the container is ready, **browser-sync** starts automatically on port 3000 with live reload. VS Code will forward the port and offer to open it in your browser.

   If the server is not running, start it manually:

   ```bash
   browser-sync start --server --files 'index.html, src/**/*' --port 3000 --no-open
   ```

6. Open <http://localhost:3000> in your browser. Any changes to `index.html` or files under `src/` trigger an automatic browser refresh.

## Tests

Tests
_____

Test files map 1:1 to features:

| Feature file | Test file	| Tests |
| -- | -- | -- |
| route-selection.feature	| route-selection.spec.js | 7 |
| waste-type-selection.feature	| waste-type-selection.spec.js	| 7 |
| alert-configuration.feature	| alert-configuration.spec.js	| 5 |
| summary.feature	| summary.spec.js	| 5 |
| download.feature	| download.spec.js	| 8 |
| preview.feature	| preview.spec.js	| 8 |
| ics-format.feature	| ics-format.spec.js	| 10 |


## Running tests

End-to-end tests use [Playwright](https://playwright.dev/) (Chromium) and live in `tests/e2e/`. The test specs correspond to the Gherkin features in `features/`.

```bash
# Run all tests (headless)
npm test

# Run with a visible browser
npm run test:headed

# Run a single test file
npx playwright test tests/e2e/route-selection.spec.js

# Run tests matching a name pattern
npx playwright test -g "Download"

# BEST option is to run all tests with the --reporter=html flag, which generates an interactive HTML report you can open in the browser
npx playwright test --reporter=html

```
