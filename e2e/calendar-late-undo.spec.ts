import { DatabaseSync } from "node:sqlite";
import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { bookFutureSlot, isoDate, registerPatient } from "./calendar-helpers";

// PA-M06: Undo for 10 seconds after cancelling, and a late entry on a closed day with a reason.
// Design: Calendar.dc.html (toast), Book dialog. Fake data only.
const D1_DIR = "apps/worker/.wrangler/e2e-state/v3/d1/miniflare-D1DatabaseObject";
function auditCount(like: string): number {
  const file = readdirSync(D1_DIR).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
  const db = new DatabaseSync(`${D1_DIR}/${file}`);
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE after_json LIKE ?")
    .get(like) as {
    n: number;
  };
  db.close();
  return row.n;
}

test("Undo puts a just-cancelled appointment back, with an audit row", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Undo Test ${stamp}`;
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await registerPatient(page, name, stamp);
  const date = await bookFutureSlot(page);
  await page.goto(`/app/appointments?date=${date}&view=day`);
  await page.locator(".day-card", { hasText: name }).click();
  await page
    .getByLabel("Appointment details")
    .getByRole("button", { name: "Cancel appointment" })
    .click();
  await page.locator("dialog[open]").getByRole("button", { name: "Cancel appointment" }).click();
  const toast = page.locator(".toast", { hasText: /Cancelled Undo Test/ });
  await expect(toast).toBeVisible();
  await expect(page.locator(".day-card-muted", { hasText: name }).first()).toBeVisible();

  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".toast-text", { hasText: /Put Undo Test .* back/ })).toBeVisible();
  await expect(page.locator(".day-card:not(.day-card-muted)", { hasText: name })).toHaveCount(1);
  expect(auditCount("%undoCancel%")).toBeGreaterThan(0);
});

test("late entry on a closed day needs a reason and shows on that day", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Late Test ${stamp}`;
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await registerPatient(page, name, stamp);
  // The next Sunday: the clinic is closed on Sundays by default.
  let sunday = isoDate(1);
  while (new Date(`${sunday}T12:00:00Z`).getUTCDay() !== 0) {
    sunday = new Date(Date.parse(`${sunday}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  }
  await page.goto(`/app/appointments?date=${sunday}&view=day`);
  await page.getByRole("button", { name: "Book appointment" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Patient").fill(name);
  await dialog.locator("button.quick-book-result").first().click();
  await dialog.getByRole("button", { name: "Consultation", exact: true }).click();
  await dialog.getByLabel(/More dates/).fill(sunday);
  await expect(dialog.getByText(/No free times on/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Book", exact: true })).toBeDisabled();

  await dialog.getByText(/^Late entry:/).click();
  await dialog.getByLabel("Time").fill("11:00");
  const use = dialog.getByRole("button", { name: "Use this time" });
  await expect(use).toBeDisabled(); // no reason yet
  await dialog.getByLabel(/Reason/).fill("Fake: emergency, doctor agreed");
  await use.click();
  await expect(dialog.getByRole("status")).toContainText("Late entry");
  await dialog.getByRole("button", { name: "Book", exact: true }).click();
  await expect(page.locator(".toast-text", { hasText: /Booked for/ })).toBeVisible();

  await page.goto(`/app/appointments?date=${sunday}&view=day`);
  await expect(page.getByText(/These are late entries/)).toBeVisible();
  await expect(page.getByText(name).first()).toBeVisible();
  expect(auditCount("%Fake: emergency, doctor agreed%")).toBeGreaterThan(0);
});
