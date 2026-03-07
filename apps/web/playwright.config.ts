import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --webpack",
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000/__mock_api__",
    },
    port: 3000,
    reuseExistingServer: false,
  },
});
