import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-cms-v2",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  use: { baseURL: "http://127.0.0.1:3002", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "node scripts/cms-test-server.mjs",
    env: { CMS_TEST_EDITOR_V2: "1" },
    url: "http://127.0.0.1:3002/api/health",
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
