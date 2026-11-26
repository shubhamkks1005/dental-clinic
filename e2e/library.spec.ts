import { expect, test, type Page } from "@playwright/test";

// Library final design (docs/design/final/library_align_dentistry (7).html, handoff
// docs/design/handoff/library.md section 10). Fake data only; own names so reruns do not clash.
const stamp = Date.now().toString().slice(-6);
const SHOTS = "docs/ui-audit/screenshots/redesign/library";

async function open(page: Page, list = "medicines") {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto(`/app/library/${list}`);
  await expect(page.locator("[data-row-id]").first()).toBeVisible();
}
const card = (page: Page, name: string) => page.locator("[data-row-id]", { hasText: name });
const modal = (page: Page) => page.locator("dialog[open].ld-modal").first();

test("T5/T6/T7/T18: add a medicine by name only; suggestions; combination; exact duplicate", async ({
  page,
}) => {
  await open(page);
  const opener = page.getByRole("button", { name: "Add medicine" });
  await opener.click();
  const name = page.getByRole("combobox", { name: "Medicine name" });
  // T18: nothing on focus, matches only, picking fills the name only.
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await name.fill("amox");
  await expect(page.getByRole("option", { name: "Amoxicillin + Clavulanic Acid" })).toBeVisible();
  await name.fill("zzzq");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  // T6: a "+" turns Combination on until the doctor touches it.
  await name.fill(`Fake A + B ${stamp}`);
  const combo = modal(page).getByRole("switch");
  await expect(combo).toBeChecked();
  await combo.uncheck();
  await name.fill(`Fake A + B + C ${stamp}`);
  await expect(combo).not.toBeChecked();
  // T5: name only.
  await name.fill(`Fake Onlyname ${stamp}`);
  await modal(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal(page)).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.getByTestId("library-banner")).toContainText(
    `"Fake Onlyname ${stamp}" added to Medicines. It is at the end (position`,
  );
  await page.getByRole("searchbox").fill(`Fake Onlyname ${stamp}`);
  await card(page, `Fake Onlyname ${stamp}`).click();
  await expect(card(page, `Fake Onlyname ${stamp}`)).toContainText("As directed");
  await expect(card(page, `Fake Onlyname ${stamp}`)).toContainText("You wrote this 0 times");
  // T7: the exact same medicine again is refused; the form stays open with the sentence.
  await opener.click();
  await page.getByRole("combobox", { name: "Medicine name" }).fill(`Fake Onlyname ${stamp}`);
  await modal(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal(page).getByRole("alert")).toHaveText("This is already in your list.");
  // ... with another strength it saves.
  await modal(page).getByLabel("Strength").fill("250 mg");
  await modal(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal(page)).toHaveCount(0);
  await expect(card(page, `Fake Onlyname ${stamp}`)).toHaveCount(2);
});

test("T12/T22/T31: hide and show again, unsaved guard, keyboard expand", async ({ page }) => {
  await open(page, "diagnoses");
  const name = `Fake Dx ${stamp}`;
  await page.getByRole("button", { name: "Add diagnosis" }).click();
  await page.getByRole("combobox", { name: "Name" }).fill(name);
  // T22: Esc after typing asks first.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toContainText("Leave without saving?");
  await page.getByRole("button", { name: "Keep editing" }).click();
  await modal(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal(page)).toHaveCount(0);
  // T31: Enter on the focused card expands it (Q11: who and when).
  const c = card(page, name);
  await c.focus();
  await page.keyboard.press("Enter");
  await expect(c).toContainText("Created by:");
  await expect(c).toContainText("Last updated:");
  // T12: hide, then show again, three times.
  for (let i = 0; i < 3; i++) {
    await c.getByRole("button", { name: "Hide" }).click();
    await expect(c).toHaveCount(0);
    await expect(page.getByTestId("library-banner")).toContainText(
      "is hidden from clinic choices.",
    );
    await page.getByRole("button", { name: /^Hidden \d+/ }).click();
    await expect(c.getByText("Hidden", { exact: true })).toBeVisible();
    await c.getByRole("button", { name: "Show again" }).click();
    await expect(page.getByTestId("library-banner")).toContainText("is active again.");
    await page.getByRole("button", { name: /^Active \d+/ }).click();
  }
});

test("T13/T15: reorder mode, sort turns reorder off", async ({ page }) => {
  await open(page, "visit_types");
  await page.getByRole("combobox", { name: "Sort items" }).selectOption("az");
  await expect(page.getByRole("button", { name: "Reorder" })).toBeDisabled();
  await expect(page.getByText("Switch to Custom order to reorder.")).toBeVisible();
  await page.getByRole("combobox", { name: "Sort items" }).selectOption("custom");
  await page.getByRole("button", { name: "Reorder" }).click();
  await expect(page.getByText("Reordering active items.", { exact: false })).toBeVisible();
  const first = page.locator("[data-row-id]").first();
  const label = (await first.getAttribute("aria-label")) ?? "";
  await expect(page.getByRole("button", { name: `Move ${label} up` })).toBeDisabled();
  await page.getByRole("button", { name: `Move ${label} down` }).click();
  await expect(page.locator("[data-row-id]").nth(1)).toHaveAttribute("aria-label", label);
  await page.getByRole("button", { name: `Move ${label} up` }).click();
  await expect(page.locator("[data-row-id]").first()).toHaveAttribute("aria-label", label);
  await page.reload();
  await expect(page.locator("[data-row-id]").first()).toHaveAttribute("aria-label", label);
});

test("T9/T17/T35: set editor picks medicines; hidden medicine blocks Save", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  const add = (label: string) =>
    page.request.post("/api/staff/lists/medicines", {
      headers: { "x-clinic-request": "1", origin: "http://localhost:8787" },
      data: { label, data: {} },
    });
  await add(`Fake Setmed ${stamp}`);
  await open(page, "medicine_sets");
  await page.getByRole("button", { name: "Add medicine set" }).click();
  await page.getByRole("combobox", { name: "Set name" }).fill(`Fake Set ${stamp}`);
  await modal(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal(page).getByRole("alert")).toHaveText("A set needs at least one medicine.");
  await modal(page).getByRole("searchbox").fill(`Fake Setmed ${stamp}`);
  await modal(page)
    .getByRole("button", { name: `+ Fake Setmed ${stamp}` })
    .click();
  await modal(page).getByRole("searchbox").fill("Paracetamol");
  await modal(page)
    .getByRole("button", { name: /^\+ Paracetamol/ })
    .first()
    .click();
  await modal(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal(page)).toHaveCount(0);
  await expect(card(page, `Fake Set ${stamp}`)).toContainText(`Fake Setmed ${stamp}`);

  // Hide only: the set shows the hidden medicine and is not offered (T35).
  await page.goto("/app/library/medicines");
  await page.getByRole("searchbox").fill(`Fake Setmed ${stamp}`);
  await card(page, `Fake Setmed ${stamp}`).getByRole("button", { name: "Hide" }).click();
  await expect(page.getByRole("alertdialog")).toContainText(`Fake Set ${stamp}`);
  await page.getByRole("button", { name: /^Hide only/ }).click();
  await page.goto("/app/library/medicine_sets");
  const set = card(page, `Fake Set ${stamp}`);
  await expect(set).toContainText("(Hidden)");
  await expect(set).toContainText("Not offered in visits until fixed.");
  await set.getByRole("button", { name: "Edit" }).click();
  await modal(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal(page).getByRole("alert")).toContainText(
    "Remove the hidden or missing medicines",
  );
  await modal(page)
    .getByRole("button", { name: `Remove Fake Setmed ${stamp}` })
    .click();
  await modal(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal(page)).toHaveCount(0);
  await expect(set).not.toContainText("Not offered");
});

test("T29: the receptionist has no Library and no usage numbers", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app");
  await expect(page.getByRole("link", { name: "Library" })).toHaveCount(0);
  expect((await page.request.get("/api/staff/library/medicine-usage")).status()).toBe(403);
});

test("T30: 360, 768 and 1366 without sideways scroll; targets at least 40 px", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  for (const [w, h] of [
    [360, 780],
    [768, 1024],
    [1366, 768],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/app/library/medicines");
    await expect(page.locator("[data-row-id]").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    const small = await page.evaluate(
      () =>
        [...document.querySelectorAll(".library-doc button, .library-doc a, .library-doc input")]
          .filter((e) => (e as HTMLElement).offsetParent !== null)
          .filter((e) => !e.closest("details:not([open])"))
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.width > 0 && r.height < 40).length,
    );
    expect(small, `targets under 40 px high at ${w}`).toBe(0);
    await page.screenshot({ path: `${SHOTS}/Library-${w}.png` });
    await page.getByRole("button", { name: "Add medicine" }).click();
    await page.screenshot({ path: `${SHOTS}/LibraryAdd-${w}.png` });
    await page.keyboard.press("Escape");
  }
});
