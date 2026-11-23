import { expect, test, type Page } from "@playwright/test";

// Q1.11 (from docs/ui-audit/runner/f01.mjs): the receptionist never opens doctor-only pages or reads
// doctor-only data; the doctor opens them. Pages give one permission sentence; the API says 403.
// The checks run before any record is looked up, so ids can be made up.

const DENIED = /You do not have permission to open this page/;
const ID = "01M85FAKEIDFORPERMISSIONTEST";

const DOCTOR_ONLY_PAGES: [string, string][] = [
  ["visit", `/app/visits/${ID}`],
  ["new certificate", `/app/patients/${ID}/certificates/new`],
  ["history summary print", `/app/print/history-summary/${ID}`],
  ["error log", "/app/errors"],
  ["settings: medicines", "/app/settings/medicines"],
  ["settings: billing", "/app/settings/billing"],
  ["style guide", "/app/style-guide"],
];
const SHARED_PAGES: [string, string][] = [
  ["today", "/app"],
  ["patients", "/app/patients"],
  ["billing", "/app/billing"],
  ["reports (today's summary)", "/app/reports"],
  ["patient requests", "/app/requests"],
  ["settings: timings", "/app/settings/timings"],
];

async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

test("receptionist: doctor-only pages show the permission sentence, shared pages open", async ({
  page,
}) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  for (const [name, url] of DOCTOR_ONLY_PAGES) {
    await open(page, url);
    await expect(page.getByText(DENIED), `receptionist opening ${name}`).toBeVisible();
  }
  for (const [name, url] of SHARED_PAGES) {
    await open(page, url);
    await expect(page.getByText(DENIED), `receptionist opening ${name}`).toHaveCount(0);
  }
});

test("doctor opens the doctor-only pages", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  for (const [name, url] of DOCTOR_ONLY_PAGES) {
    await open(page, url);
    await expect(page.getByText(DENIED), `doctor opening ${name}`).toHaveCount(0);
  }
});

test("API: the receptionist is refused doctor-only data, the doctor is not", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  const refused = [
    `/api/staff/visits/${ID}`,
    `/api/staff/visits/${ID}/prescriptions`,
    "/api/staff/errors",
    "/api/staff/users",
    "/api/staff/lists/medicines",
  ];
  for (const url of refused) {
    expect((await page.request.get(url)).status(), `receptionist GET ${url}`).toBe(403);
  }
  const mine = (await (await page.request.get("/api/staff/settings")).json()) as {
    data: { settings: { key: string }[] };
  };
  expect(mine.data.settings.some((s) => s.key.startsWith("billing."))).toBe(false);

  await page.goto("/api/staff/auth/dev-login?role=doctor");
  expect((await page.request.get("/api/staff/lists/medicines")).status()).toBe(200);
  const theirs = (await (await page.request.get("/api/staff/settings")).json()) as {
    data: { settings: { key: string }[] };
  };
  expect(theirs.data.settings.some((s) => s.key.startsWith("billing."))).toBe(true);
});
