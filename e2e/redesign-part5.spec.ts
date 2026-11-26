import { openAccordion, openVisitFromToday } from "./doctor-helpers";
import { expect, test, type Page } from "@playwright/test";

// Q2.8 Messages, Q2.11 chrome, Q2.12 Reports, Q2.13 Settings and Library. Fake data only.
// SHOTS=1 saves screenshots under docs/ui-audit/screenshots/redesign/<task>/.
const SHOTS = process.env.SHOTS ? "docs/ui-audit/screenshots/redesign" : "";
const shot = async (page: Page, rel: string) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${rel}.png` });
};
const noSideways = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

test("Q2.11 chrome: sidebar from 768, round + only on Today and Patients, More page", async ({
  page,
}) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/app/patients");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Appointments" })).toBeVisible();
  await noSideways(page);
  await shot(page, "Q2.11/Tablet-Patients");

  await page.setViewportSize({ width: 360, height: 740 });
  const fab = page.getByRole("link", { name: "New patient", exact: true });
  for (const path of ["/app", "/app/patients"]) {
    await page.goto(path);
    await expect(fab, path).toBeVisible();
    await noSideways(page);
  }
  for (const path of ["/app/appointments", "/app/messages", "/app/billing", "/app/more"]) {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "Main" }), path).toBeVisible();
    await expect(fab, path).toHaveCount(0);
    await noSideways(page);
  }
  // More: user, Messages, Reports, Sign out, every row 44 px or taller.
  await page.goto("/app/more");
  await expect(page.getByRole("link", { name: /Messages/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  for (const link of await page.locator(".more-list a").all()) {
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await shot(page, "Q2.11/PhoneMore");
  await page.goto("/app/messages");
  await shot(page, "Q2.8/PhoneMessages");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/app/messages");
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await noSideways(page);
  await shot(page, "Q2.8/Messages");

  // The doctor's top bar has no Walk-in or + New patient.
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/patients");
  await expect(page.getByRole("link", { name: "+ New patient" })).toHaveCount(0);
});

test("Q2.12 Reports: four numbers and Things to watch first, charts folded", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/reports");
  await expect(page.getByText("Arrived today")).toBeVisible();
  await expect(page.getByText("Outstanding", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Things to watch" })).toBeVisible();
  const fold = page.locator("details.dash-fold");
  await expect(fold).not.toHaveAttribute("open", "");
  await noSideways(page);
  await shot(page, "Q2.12/Reports");
  await fold.locator("summary").click();
  await expect(fold).toHaveAttribute("open", "");
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/app/reports");
  await expect(page.getByRole("region", { name: "Things to watch" })).toBeVisible();
  await noSideways(page);
  await shot(page, "Q2.12/PhoneReports");

  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/reports");
  await expect(page.getByText(/full dashboard is for the doctor/)).toBeVisible();
});

test("Q2.13 Settings has 8 items and a setup card; Library takes the lists; new visit type reaches Book", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-5);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/settings");
  const nav = page.getByRole("navigation", { name: "Settings sections" });
  await expect(nav.getByRole("link")).toHaveCount(8);
  await expect(page.getByRole("region", { name: "Setup progress" })).toBeVisible();
  await noSideways(page);
  await shot(page, "Q2.13/Settings");

  // Old list paths land in the Library.
  await page.goto("/app/settings/medicines");
  await expect(page).toHaveURL(/\/app\/library\/medicines/);
  await expect(page.getByRole("tablist", { name: "Library lists" })).toBeVisible();
  await shot(page, "Q2.13/Library");

  // Add a visit type in the Library.
  await page.goto("/app/library/visit_types");
  await page.getByRole("button", { name: "Add visit type" }).click();
  const drawer = page.locator("dialog[open]");
  await drawer.getByRole("combobox", { name: "Name" }).fill(`Chip Check ${stamp}`);
  await drawer.getByLabel(/Usual length/).selectOption("20");
  await drawer.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(`Chip Check ${stamp}`).first()).toBeVisible();

  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/app/library/medicines");
  await noSideways(page);
  await shot(page, "Q2.13/PhoneLibrary");
  await page.goto("/app/settings");
  await noSideways(page);
  await shot(page, "Q2.13/PhoneSettings");

  // The receptionist sees it as a chip in Book, and has no Library.
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/library/medicines");
  await expect(page.getByText("Not available for your role")).toBeVisible();
  await page.goto("/app/appointments?book=1");
  await expect(
    page.locator("dialog[open]").getByRole("button", { name: `Chip Check ${stamp}` }),
  ).toBeVisible();
});

test("Q2.13 inside a visit, a medicine that is not in the list can be added to it", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Lib Visit ${stamp}`;
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Male", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("44");
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

  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app");
  await openVisitFromToday(page, name);
  await expect(page.getByLabel("Chief Complaints", { exact: true })).toBeVisible();

  const drug = `Zedtestmed ${stamp}`;
  await openAccordion(page, "rx");
  await page.getByPlaceholder(/Search medicine/).fill(drug);
  await page.getByRole("button", { name: new RegExp(`Add .*${drug}.* to my list`) }).click();
  const add = page.getByRole("group", { name: "Add to my list" });
  await expect(add.getByRole("button", { name: /Add to my list and use it/ })).toBeDisabled();
  await add.getByLabel("Strength").fill("250 mg");
  await add.getByRole("button", { name: /Add to my list and use it/ }).click();
  await expect(page.getByRole("region", { name: "Medicines" })).toContainText(drug);

  // It is now in the Library list.
  await page.goto("/app/library/medicines");
  await page.getByRole("searchbox").fill(drug);
  const added = page.locator("[data-row-id]", { hasText: drug });
  await expect(added).toBeVisible();
  // Added from a visit, not typed in the Library: it waits for the doctor to confirm (Confirm).
  await expect(added).toContainText("Needs review");
  await expect(added.getByRole("button", { name: "Confirm" })).toBeVisible();
});
