import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig(base, {
  // Exercise the emitted Wrangler configuration, without fixture bindings.
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command:
      "wrangler dev --config dist/server/wrangler.json --local --ip 127.0.0.1 --port 4173 --inspector-port 0",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
