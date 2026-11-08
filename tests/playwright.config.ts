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
  },
  webServer: {
    cwd: projectRoot,
    command: "npm run dev",
    url: "http://localhost:3000",
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
