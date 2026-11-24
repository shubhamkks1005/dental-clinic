import { openVisitFromToday } from "./doctor-helpers";
import { expect, test } from "@playwright/test";

// Q2.5/Q2.13 gap: a finalised visit whose prescription was written but not issued shows
// "Prescription not issued" in the doctor's Today, under Waiting for you. Fake data only.
test("doctor Today lists a written-but-not-issued prescription of a finalised visit", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Rx Draft ${stamp}`;
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Female", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("35");
  await page.getByLabel("Mobile", { exact: true }).fill(`9008${stamp}`);
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
  await expect(page.getByLabel("Complaint")).toBeVisible();
  await page.getByLabel("Complaint").fill("Fake: tooth pain");

  // A medicine from the doctor's own list makes a DRAFT prescription; it is never issued.
  await page.getByPlaceholder(/Search medicine/).fill("Amox");
  await page
    .getByRole("region", { name: "Medicines" })
    .getByRole("button", { name: /^Amoxicillin/ })
    .first()
    .click();
  await expect(page.getByRole("region", { name: "Medicines" })).not.toContainText(
    "No medicines yet",
  );

  await page.getByRole("button", { name: "Finalise visit" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Finalise", exact: true }).click();
  await expect(page.getByRole("button", { name: "Create bill" })).toBeVisible();

  // While the patient is still in the chair the Now card covers them; after Done they are not.
  await page.goto("/app");
  await page
    .getByRole("region", { name: "Current patient in chair" })
    .getByRole("button", { name: "Done" })
    .click();
  await expect(page.getByRole("region", { name: "Current patient in chair" })).not.toContainText(
    name,
  );
  const waiting = page
    .locator("li.td-item", { hasText: name })
    .filter({ hasText: /pending issue/i });
  await expect(waiting).toContainText(/Prescription/);
  await expect(waiting).toContainText("Prescription written, pending issue");
  await waiting
    .getByRole("button", { name: "Open" })
    .or(waiting.getByRole("link", { name: "Open" }))
    .click();
  await expect(page).toHaveURL(/\/app\/visits\//);
});
