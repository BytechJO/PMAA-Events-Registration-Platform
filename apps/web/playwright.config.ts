import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests against the built app (pnpm build first). CI installs Chromium;
 * on a Windows machine without it, run with PW_CHANNEL=msedge to use the installed Edge.
 */
const port = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm start --port ${port}`,
    url: `http://localhost:${port}/api/health`,
    // Admin test sign-in (pick a role) and sample registrations. Allowed only because the base URL is localhost.
    env: { APP_BASE_URL: `http://localhost:${port}`, ADMIN_DEV_SIGN_IN: "true", PUBLIC_SAMPLE_DATA: "true" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
