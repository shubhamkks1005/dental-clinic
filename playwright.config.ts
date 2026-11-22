import { defineConfig, devices } from "@playwright/test";

// 1.7.3: small local smoke only (Chromium). Staging Google login stays a manual owner check.
const PORT = 8787;
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: ORIGIN,
    trace: "off",
    video: "off",
    screenshot: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm --filter @clinic/web build && pnpm --filter @clinic/worker wr d1 migrations apply DB --local --env='' && pnpm --filter @clinic/worker wr dev --env='' --ip 127.0.0.1 --port ${PORT}`,
    url: `${ORIGIN}/api/staff/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
