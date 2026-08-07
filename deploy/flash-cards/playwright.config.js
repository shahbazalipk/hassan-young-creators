import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: "npx --yes serve -l 4173 .",
    port: 4173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
