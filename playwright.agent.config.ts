import { defineConfig, devices } from "@playwright/test";

/**
 * Agent-readiness suite config.
 *
 * Runs against `astro dev` (NOT preview) because the markdown-negotiation
 * middleware only executes at request time in dev / on Vercel's edge runtime;
 * `astro preview` serves the static build without middleware.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "agent-readiness.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: "html",
  use: {
    baseURL: process.env.TEST_URL || "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // When TEST_URL targets a deployed URL there is no local dev server to
  // start; omit webServer so remote runs only hit the configured target.
  ...(process.env.TEST_URL
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:4321",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
