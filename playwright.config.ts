import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  // When TEST_URL points at a deployed target (preview/production), no local
  // server exists to start; omit webServer entirely so remote runs don't try
  // to launch `npm run dev` or wait on the local port.
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
