import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

export default defineConfig({
  testDir: resolve(projectRoot, "tests/e2e"),
  outputDir: resolve(projectRoot, "test-results"),
  fullyParallel: false,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    cwd: projectRoot,
    command: "npm run dev",
    url: "http://localhost:3000",
    // scripts/stop-owned-vinext-dev.mjs clears this checkout's vinext dev
    // server between suites. Each suite still starts its own server.
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "webkit",
      grep: /@webkit/,
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
