import { openVisitFromToday } from "./doctor-helpers";
import { expect, test, type Page } from "@playwright/test";

// Doctor visit page (docs/design/final/doctor_visit.html), Accordion 2: diagnoses and procedures.
// Handoff test cases 1-8, 12-14. Fake data only.

/** The scratch database is shared by every spec: free the chair before a patient is added. */
async function freeChair(page: Page) {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  const headers = {
    origin: "http://localhost:8787",
    "x-clinic-request": "1",
    "content-type": "application/json",
  };
  const day = await page.request.get("/api/staff/appointments");
  const body = (await day.json()) as {
    data?: { appointments?: { id: string; status: string; version: number }[] };
  };
  for (const a of body.data?.appointments ?? []) {
    if (a.status === "in_chair") {
      await page.request.patch(`/api/staff/appointments/${a.id}/status`, {
        headers,
        data: { status: "completed", version: a.version },
      });
    }
  }
}

async function walkIn(page: Page, name: string, stamp: string) {
  await freeChair(page);
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Female", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("33");
  await page.getByLabel("Mobile", { exact: true }).fill(`9007${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
  await page.goto("/app");
  await page.getByRole("button", { name: "Walk-in" }).last().click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Patient").fill(name);
  await dialog.locator("button.quick-book-result").first().click();
  await dialog.getByRole("button", { name: "Consultation", exact: true }).click();
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: /Add walk-in/ }).click();
  await expect(dialog).toBeHidden();
}

/** Opens the visit from Today (so a draft exists), then goes to the new page of the same visit. */
/** Opens Accordion 2 unless it is already open (the page remembers the open card). */
async function openDiag(page: Page) {
  await page.locator("details#vd-acc-diag").waitFor({ state: "attached" });
  const open = await page.locator("details#vd-acc-diag[open]").count();
  if (!open) await page.getByText("Diagnosis & Procedures", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Diagnoses" })).toBeVisible();
}

async function openNewPage(page: Page, name: string) {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app");
  await openVisitFromToday(page, name);
  await expect(page).toHaveURL(/\/app\/visits\/[^/]+$/);
  const url = page.url();
  await page.goto(`${url}/new`);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await openDiag(page);
  return url;
}

const lines = (page: Page, kind: "diagnosis" | "procedure") =>
  page.locator(`[data-line="${kind}"]`);

test("diagnoses and procedures: add, tooth, undo, none, reload, rules", async ({ page }) => {
  test.setTimeout(150_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 500) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const name = `Lines Page ${stamp}`;
  await walkIn(page, name, stamp);
  await openNewPage(page, name);

  const dx = page.getByRole("combobox", { name: "Search diagnosis (or type new)" });
  const pr = page.getByRole("combobox", { name: "Search procedure or code" });
  const summary = page.getByTestId("acc-diag-summary");
  await expect(summary).toHaveText("0 diagnoses · 0 procedures");
  await expect(page.getByText("No diagnosis yet. Search and press Enter to add.")).toBeVisible();

  // Case 1: from the list. Case 2: free text.
  await dx.fill("pulp");
  await dx.press("Enter");
  await expect(lines(page, "diagnosis")).toHaveCount(1);
  await expect(page.getByText("Added diagnosis: Irreversible pulpitis")).toBeVisible();
  await dx.fill("Fake odd finding");
  await dx.press("Enter");
  await expect(lines(page, "diagnosis")).toHaveCount(2);
  await expect(lines(page, "diagnosis").nth(1)).toContainText("Free text");
  await expect(summary).toHaveText("2 diagnoses · 0 procedures");

  // Case 3: a wrong tooth number is refused with one sentence; a right one is kept.
  const tooth = lines(page, "diagnosis")
    .first()
    .getByLabel(/Tooth number for/);
  await tooth.fill("19");
  await tooth.blur();
  await expect(page.getByText("Use an FDI tooth number")).toBeVisible();
  await tooth.fill("36");
  await tooth.blur();
  await expect(page.getByText("Use an FDI tooth number")).toBeHidden();
  await expect(page.getByTestId("lines-save-state")).toContainText("Saved");

  // Case 4: remove, Undo, five times.
  for (let i = 0; i < 5; i++) {
    await lines(page, "diagnosis")
      .nth(1)
      .getByRole("button", { name: /^Remove/ })
      .click();
    await expect(lines(page, "diagnosis")).toHaveCount(1);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(lines(page, "diagnosis")).toHaveCount(2);
    await expect(lines(page, "diagnosis").nth(1)).toContainText("Fake odd finding");
  }

  // Procedures: from the list only; unknown name offers "Add to my list".
  await pr.fill("compo");
  await pr.press("Enter");
  await expect(lines(page, "procedure")).toHaveCount(1);
  const proc = lines(page, "procedure").first();
  await expect(proc).not.toContainText("₹");
  await proc.getByLabel(/Tooth number for/).fill("36");
  await proc.getByLabel(/Tooth number for/).blur();
  await proc.getByRole("button", { name: "O", exact: true }).click();
  await expect(proc.getByRole("button", { name: "O", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await proc.getByLabel(/Note for/).fill("Sitting 1 of 2");
  await proc.getByLabel(/Note for/).blur();
  await proc.getByLabel("Needs more sittings").check();

  // Case 6: the same procedure on the same tooth twice: a notice, both kept.
  await pr.fill("compo");
  await pr.press("Enter");
  await expect(lines(page, "procedure")).toHaveCount(2);
  await lines(page, "procedure")
    .nth(1)
    .getByLabel(/Tooth number for/)
    .fill("36");
  await lines(page, "procedure")
    .nth(1)
    .getByLabel(/Tooth number for/)
    .blur();
  await expect(page.getByText("Same procedure appears twice on the same tooth")).toBeVisible();

  // Case 7: not in the list: name and fee go to the list, the line appears.
  await pr.fill("Fake whitening session");
  await page.getByPlaceholder("Fee (Rs)").fill("1500");
  await page.getByRole("button", { name: "Add to my list" }).click();
  await expect(lines(page, "procedure")).toHaveCount(3);
  await expect(lines(page, "procedure").nth(2)).toContainText("Fake whitening session");

  // Case 8: "No diagnosis" while lines exist is refused with a sentence.
  await page.getByRole("button", { name: "No diagnosis for this visit" }).click();
  await expect(page.getByRole("alert")).toContainText("Remove it first");
  await page.getByRole("button", { name: "Dismiss" }).click();

  // The Undo toast hides by itself after 6 s (owner decision Q9).
  await expect(page.getByRole("button", { name: "Undo" })).toBeHidden({ timeout: 9_000 });

  // Reload: everything is still there.
  await page.reload();
  await openDiag(page);
  await expect(lines(page, "diagnosis")).toHaveCount(2);
  await expect(lines(page, "procedure")).toHaveCount(3);
  await expect(
    lines(page, "diagnosis")
      .first()
      .getByLabel(/Tooth number for/),
  ).toHaveValue("36");
  await expect(
    lines(page, "procedure").first().getByRole("button", { name: "O", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(lines(page, "procedure").first().getByLabel("Needs more sittings")).toBeChecked();
  await expect(
    lines(page, "procedure")
      .first()
      .getByLabel(/Note for/),
  ).toHaveValue("Sitting 1 of 2");

  // None choices: remove the lines, choose "none", reload: it is stored.
  for (const kind of ["diagnosis", "procedure"] as const) {
    while ((await lines(page, kind).count()) > 0) {
      const before = await lines(page, kind).count();
      await lines(page, kind)
        .first()
        .getByRole("button", { name: /^Remove/ })
        .click();
      await expect(lines(page, kind)).toHaveCount(before - 1);
    }
  }
  await page.getByRole("button", { name: "No diagnosis for this visit" }).click();
  await page.getByRole("button", { name: "No procedure for this visit" }).click();
  await expect(page.getByText("No diagnosis for this visit.")).toBeVisible();
  await expect(page.getByTestId("lines-save-state")).toContainText("Saved");
  await page.reload();
  await openDiag(page);
  await expect(page.getByText("Diagnosis done ✓").first()).toBeVisible();
  await expect(page.getByText("Procedures done ✓").first()).toBeVisible();
  expect(bad).toEqual([]);
});

test("a slow server does not slow the screen, and a refusal puts the line back", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Lines Slow ${stamp}`;
  await walkIn(page, name, stamp);
  await openNewPage(page, name);
  const dx = page.getByRole("combobox", { name: "Search diagnosis (or type new)" });

  // Case 14: with a 300 ms server the line shows at once.
  await page.route("**/api/staff/visits/*/diagnoses", async (route) => {
    await new Promise((r) => setTimeout(r, 300));
    await route.continue();
  });
  await dx.fill("Fake slow finding");
  const t0 = Date.now();
  await dx.press("Enter");
  await expect(lines(page, "diagnosis")).toHaveCount(1);
  expect(Date.now() - t0).toBeLessThan(250);
  await expect(page.getByTestId("lines-save-state")).toContainText("Saved", { timeout: 5_000 });
  await page.unroute("**/api/staff/visits/*/diagnoses");

  // Case 13: the server refuses: the line goes back and one sentence says why.
  await page.route("**/api/staff/visits/*/diagnoses", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            error: { code: "conflict", message: "Someone else changed this visit." },
          }),
        })
      : route.continue(),
  );
  await dx.fill("Fake refused finding");
  await dx.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Someone else changed this visit.");
  await expect(lines(page, "diagnosis")).toHaveCount(1);
  await expect(page.getByTestId("lines-save-state")).toContainText("Not saved");
});

test("no sideways scroll at 360, 768 and 1366", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Lines Wide ${stamp}`;
  await walkIn(page, name, stamp);
  await openNewPage(page, name);
  for (const width of [360, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});

test("a receptionist cannot open the new page", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  const res = await page.goto("/app/visits/does-not-matter/new");
  expect(res?.status()).toBeLessThan(500);
  await expect(page.getByRole("heading", { name: "Diagnoses" })).toBeHidden();
});

test("the tooth card shows the tooth, its note and history", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Lines Tooth ${stamp}`;
  await walkIn(page, name, stamp);
  await openNewPage(page, name);
  await page.locator("#vd-acc-chart > summary").click();
  // Pick tooth 36 on the chart (a surface button of that tooth).
  await page.getByRole("button", { name: /36/ }).first().click();
  const card = page.getByRole("region", { name: "Tooth 36" });
  await expect(card).toContainText("36 · Lower left first molar");
  await card.getByLabel("Clinical note for tooth 36").fill("Fake cold sensitivity");
  await card.getByRole("button", { name: "Save note" }).click();
  await expect(card.getByText("Fake cold sensitivity")).toBeVisible();
  await card.getByRole("button", { name: "Edit" }).click();
  await card.getByLabel("Clinical note for tooth 36").fill("");
  await card.getByRole("button", { name: "Save note" }).click();
  await expect(card.getByLabel("Clinical note for tooth 36")).toBeVisible();
  await card.getByRole("button", { name: "Close" }).click();
  await expect(card).toBeHidden();
});

test("the live prescription sheet follows the visit and takes its details from Settings", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Lines Sheet ${stamp}`;
  await walkIn(page, name, stamp);
  await openNewPage(page, name);
  const sheet = page.getByLabel("Prescription sheet");
  await expect(sheet).toContainText(name);
  await expect(sheet).toContainText("DRAFT");
  await expect(sheet).toContainText("No medicines yet.");
  // A diagnosis with a tooth appears under Problem teeth.
  const dx = page.getByRole("combobox", { name: "Search diagnosis (or type new)" });
  await dx.fill("Fake sheet finding");
  await dx.press("Enter");
  const tooth = page
    .locator('[data-line="diagnosis"]')
    .first()
    .getByLabel(/Tooth number for/);
  await tooth.fill("46");
  await tooth.blur();
  await expect(sheet).toContainText("Problem teeth");
  await expect(sheet).toContainText("46: Fake sheet finding");
});
