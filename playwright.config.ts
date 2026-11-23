import { defineConfig, devices } from "@playwright/test";

// 1.7.3: small local smoke only (Chromium). Staging Google login stays a manual owner check.
const PORT = 8787;
// Must be "localhost": the Worker's APP_ORIGIN is http://localhost:8787 and its CSRF guard returns 403
// on every write from 127.0.0.1. The Worker itself still listens on 127.0.0.1 (--ip below).
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  // 4.5.1 text snapshots are OS-independent (no -darwin/-linux suffix).
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: ORIGIN,
    trace: "off",
    video: "off",
    screenshot: "off",
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Fresh SCRATCH database every run (never the owner's local D1, which is half-migrated).
    command: `pnpm --filter @clinic/web build && rm -rf apps/worker/.wrangler/e2e-state && pnpm --filter @clinic/worker wr d1 migrations apply DB --local --env='' --persist-to .wrangler/e2e-state && pnpm --filter @clinic/worker wr dev --env='' --ip 127.0.0.1 --port ${PORT} --persist-to .wrangler/e2e-state`,
    url: `${ORIGIN}/api/staff/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
