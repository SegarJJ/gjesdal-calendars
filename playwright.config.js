// @ts-check
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "unit",
      testMatch: /.*\/unit\/.*\.spec\.js/,
    },
    {
      name: "e2e",
      testMatch: /.*\/e2e\/.*\.spec\.js/,
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npx browser-sync start --server --port 3000 --no-open --no-ui",
    port: 3000,
    reuseExistingServer: true,
  },
});
