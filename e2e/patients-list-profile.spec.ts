import { expect, test, type Page } from "@playwright/test";

// Q2.6: list columns and filters, one search per width, profile opens on Overview with role actions.
// Fake data only.

async function newPatient(page: Page, name: string, mobile: string) {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Gender").selectOption("female");
  await page.getByLabel("Or age (years)").fill("30");
  await page.getByLabel("Mobile", { exact: true }).fill(mobile);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
}

test("patients list shows Last visit, Next appointment and Due; one search on a laptop, a card link on a phone", async ({
  page,
}) => {
  const stamp = Date.now().toString().slice(-6);
  const name = `List Test ${stamp}`;
  await newPatient(page, name, `9001${stamp}`);

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/app/patients");
  const table = page.getByRole("region", { name: "Patients" });
  for (const head of ["Last visit", "Next appointment", "Due"]) {
    await expect(table.getByRole("columnheader", { name: head })).toBeVisible();
  }
  // The top bar is the search on a laptop: no second box inside the page.
  await expect(page.getByPlaceholder("Search by name, mobile or patient code")).toBeHidden();
  for (const chip of ["All", "New this month", "Balance due", "Not seen in 6 months", "Archived"]) {
    await expect(page.getByRole("button", { name: chip, exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Balance due", exact: true }).click();
  await expect(page.getByRole("button", { name: "Balance due", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Phone: the in-page search is the only search, results are whole-card links, no keyboard hint.
  await page.setViewportSize({ width: 360, height: 780 });
  await page.getByRole("button", { name: "All", exact: true }).click();
  const search = page.getByPlaceholder("Search by name, mobile or patient code");
  await expect(search).toBeVisible();
  await search.fill(`List Test ${stamp}`);
  const card = page.locator("a.patient-card", { hasText: name });
  await expect(card).toBeVisible();
  await expect(page.getByText(/arrow keys/)).toBeHidden();
  await expect(page.getByRole("link", { name: `+ New patient: List Test ${stamp}` })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await card.click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
});

test("profile opens on Overview; receptionist gets Take payment and Book, doctor gets New visit and Book", async ({
  page,
}) => {
  const stamp = Date.now().toString().slice(-6);
  const name = `Profile Test ${stamp}`;
  await newPatient(page, name, `9002${stamp}`);

  await page.goto("/app/patients");
  await page.getByRole("link", { name }).first().click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByRole("tab", { selected: true })).toHaveText("Overview");
  for (const card of ["Next appointment", "Balance due", "Last visit"]) {
    await expect(page.getByRole("heading", { name: card })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Take payment" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Book", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New visit" })).toHaveCount(0);
  // The receptionist never sees clinical data on the profile.
  await expect(page.getByRole("tab", { name: "Chart" })).toHaveCount(0);

  const url = page.url();
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto(url);
  await expect(page.getByRole("tab", { selected: true })).toHaveText("Overview");
  await expect(page.getByRole("button", { name: "New visit" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Book", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Take payment" })).toHaveCount(0);
});
