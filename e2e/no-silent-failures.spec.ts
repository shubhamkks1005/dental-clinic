import { expect, test } from "@playwright/test";

// Q1.6: a failed or blocked save always says why, and typed text is never lost.

test("timings: closing before opening is explained and Save says why it is off", async ({
  page,
}) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/settings/timings");
  const closes = page.getByLabel("Closes").first();
  const opens = page.getByLabel("Opens").first();
  await opens.fill("10:00");
  await closes.fill("07:00");
  await expect(page.getByText("Closing time must be after opening time.").first()).toBeVisible();
  await expect(page.getByText(/Cannot save yet\./)).toBeVisible();
  await expect(page.getByRole("button", { name: "Save opening hours" })).toBeDisabled();
  await closes.fill("18:30");
  await expect(page.getByText(/Cannot save yet\./)).toBeHidden();
  await expect(page.getByRole("button", { name: "Save opening hours" })).toBeEnabled();
});

test("visit opened in two tabs: the stale tab shows a banner and keeps the typed text", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL: "http://localhost:8787" });
  const a = await context.newPage();
  const stamp = Date.now().toString().slice(-6);
  const name = `Conflict Test ${stamp}`;

  await a.goto("/api/staff/auth/dev-login?role=receptionist");
  await a.goto("/app/patients/new");
  await a.getByLabel("Full name").fill(name);
  await a.getByLabel("Or age (years)").fill("40");
  await a.getByLabel("Mobile", { exact: true }).fill(`9000${stamp}`);
  await a.getByRole("button", { name: "Save patient" }).click();
  await expect(a.getByRole("heading", { name: "Patient saved" })).toBeVisible();
  await a.goto("/app");
  await a.getByRole("button", { name: "Walk-in" }).last().click();
  const dialog = a.locator("dialog[open]");
  await dialog.getByLabel("Patient").fill(name);
  await dialog.locator("button.quick-book-result").first().click();
  await dialog.getByLabel("Visit type").selectOption({ label: "Consultation" });
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: /Add walk-in/ }).click();
  await expect(dialog).toBeHidden();
  await a.getByRole("button", { name: "In chair" }).last().click();

  await a.goto("/api/staff/auth/dev-login?role=doctor");
  await a.goto("/app");
  await a
    .getByRole("link", { name: "Open visit" })
    .or(a.getByRole("button", { name: "Open visit" }))
    .last()
    .click();
  await expect(a.getByLabel("Chief complaint")).toBeVisible();
  const visitUrl = a.url();

  const b = await context.newPage();
  await b.goto(visitUrl);
  await expect(b.getByLabel("Chief complaint")).toBeVisible();

  // Tab A saves first: the visit version moves on.
  await a.getByLabel("Exam").fill("Written in tab A");
  await expect(a.getByText("Saved", { exact: true }).first()).toBeVisible();

  // Tab B still holds the old version: its save is refused, and says so.
  await b.getByLabel("Exam").fill("Typed in tab B");
  await expect(b.getByText(/changed in another tab or by someone else/)).toBeVisible({
    timeout: 20_000,
  });
  await expect(b.getByText("Not saved — changed elsewhere")).toBeVisible();
  await expect(b.getByLabel("Exam")).toHaveValue("Typed in tab B");
  await expect(b.getByRole("button", { name: "Copy my text" })).toBeVisible();

  // It stops retrying: no further save request goes out.
  let patches = 0;
  b.on("request", (r) => {
    if (r.method() === "PATCH" && r.url().includes("/visits/")) patches++;
  });
  await b.waitForTimeout(7_000);
  expect(patches).toBe(0);
  await context.close();
});
