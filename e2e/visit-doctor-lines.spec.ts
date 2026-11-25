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

test("a receptionist cannot open the visit page", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  const res = await page.goto("/app/visits/does-not-matter");
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

test("the dock folds to a bubble with the design motion, and the side pane can be resized", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Lines Dock ${stamp}`;
  await walkIn(page, name, stamp);
  await openNewPage(page, name);
  const complaint = page.getByLabel("Chief Complaints", { exact: true });
  await complaint.fill("Fake pain on the lower right");
  await expect(page.getByRole("status").filter({ hasText: "Saved" }).first()).toBeVisible({
    timeout: 10_000,
  });

  // Motion: 300 ms with the overshoot curve, scaling from the bottom-left corner.
  const block = page.locator(".vd-dock-block");
  const css = await block.evaluate((el) => {
    const s = getComputedStyle(el);
    return { d: s.transitionDuration, f: s.transitionTimingFunction, o: s.transformOrigin };
  });
  expect(css.d).toContain("0.3s");
  expect(css.f).toContain("cubic-bezier(0.34, 1.56, 0.64, 1)");
  await page.getByRole("button", { name: "Minimize to bottom-left circle" }).click();
  const bubble = page.getByRole("button", { name: /Expand Chief Complaints/ });
  await expect(bubble).toHaveCSS("opacity", "1", { timeout: 2_000 });
  await expect(block).toHaveCSS("opacity", "0");
  await bubble.click();
  await expect(block).toHaveCSS("opacity", "1", { timeout: 2_000 });
  await expect(complaint).toHaveValue("Fake pain on the lower right");

  // Each box folds to its title.
  await page.getByRole("button", { name: "Minimize Clinical Findings" }).click();
  await expect(page.getByLabel("Clinical Findings", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Expand Clinical Findings" }).click();

  // The side pane: drag the handle to the left and it gets wider; double-click puts it back.
  await page.setViewportSize({ width: 1440, height: 900 });
  const pane = page.getByLabel("Prescription and history");
  const before = (await pane.boundingBox())?.width ?? 0;
  const handle = page.getByRole("separator", { name: "Resize prescription panel" });
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 120, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  const wider = (await pane.boundingBox())?.width ?? 0;
  expect(wider).toBeGreaterThan(before + 60);
  await handle.dblclick();
  expect(Math.abs(((await pane.boundingBox())?.width ?? 0) - before)).toBeLessThan(2);
});

// A 1x1 PNG: enough for the file store; the viewer scales it to the box.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("the x-ray viewer opens a file, draws a mark, saves it and keeps it", async ({ page }) => {
  test.setTimeout(150_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Lines Xray ${stamp}`;
  await walkIn(page, name, stamp);
  const url = await openNewPage(page, name);
  const visitId = url.split("/").pop() as string;
  const read = await page.request.get(`/api/staff/visits/${visitId}/page`);
  const patientId = ((await read.json()) as { data: { visit: { patientId: string } } }).data.visit
    .patientId;
  const up = await page.request.post(`/api/staff/patients/${patientId}/files`, {
    headers: { origin: "http://localhost:8787", "x-clinic-request": "1" },
    multipart: {
      file: { name: "xray36.png", mimeType: "image/png", buffer: PNG },
      kind: "iopa",
      toothFdi: "36",
    },
  });
  expect(up.status()).toBeLessThan(300);
  await page.reload();
  // The dock floats over the lower cards: fold it to its bubble, as the doctor would.
  await page.getByRole("button", { name: "Minimize to bottom-left circle" }).click();
  await page.locator("#vd-acc-more > summary").click();
  await page.getByRole("button", { name: /X-ray \(IOPA\) 36/ }).click();

  const viewer = page.getByRole("dialog", { name: "X-ray viewer" });
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText(name);
  await expect(viewer.locator(".vd-xv-pct")).toHaveText("100%");
  await viewer.getByTitle("Zoom In").click();
  await expect(viewer.locator(".vd-xv-pct")).toHaveText("120%");

  // Draw a circle: choose the tool, drag on the picture, save.
  await viewer.getByRole("button", { name: "Circle", exact: true }).click();
  const stage = viewer.locator(".vd-xv-stage");
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 20, { steps: 4 });
  await page.mouse.up();
  await expect(viewer.locator("svg circle")).toHaveCount(1);
  await viewer.getByRole("button", { name: "36", exact: true }).click();
  await viewer.getByLabel("Tooth-wise annotation note").fill("Fake: apical shadow");
  await viewer.getByRole("button", { name: "Save Annotations" }).click();
  await expect(viewer.getByText("Annotations saved to visit!")).toBeVisible();

  // Escape closes it; opening it again shows the saved mark, tooth tag and note.
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await page.getByRole("button", { name: /X-ray \(IOPA\) 36/ }).click();
  await expect(viewer.locator("svg circle")).toHaveCount(1);
  await expect(viewer.getByLabel("Tooth-wise annotation note")).toHaveValue("Fake: apical shadow");
  await expect(viewer.getByRole("button", { name: "36", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Nothing to undo in a fresh view: the button is off until the doctor draws again.
  await expect(viewer.getByRole("button", { name: "Undo" })).toBeDisabled();
});
