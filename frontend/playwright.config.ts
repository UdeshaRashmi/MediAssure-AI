import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e", timeout: 30000, fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:5178", headless: true, screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} },
  projects: [
    { name: "small-phone", use: { viewport: { width: 320, height: 720 } } },
    { name: "phone", use: { viewport: { width: 390, height: 844 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1024, height: 768 } } },
    { name: "wide-desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5178 --strictPort", url: "http://127.0.0.1:5178", reuseExistingServer: !process.env.CI },
});
