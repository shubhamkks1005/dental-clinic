import { DatabaseSync } from "node:sqlite";
import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  bookFutureSlot,
  bookPopover,
  isoDate,
  registerPatient,
  loginDeskWithDoctor,
} from "./calendar-helpers";

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
  await loginDeskWithDoctor(page);
  await registerPatient(page, name, stamp);
  const date = await bookFutureSlot(page);
  await page.goto(`/app/appointments?date=${date}&view=day`);
  await page.locator(".cal-card", { hasText: name }).click();
  await page
    .getByLabel("Appointment details")
    .getByRole("button", { name: "Cancel appointment" })
    .click();
  await page.locator("dialog[open]").getByRole("button", { name: "Cancel appointment" }).click();
  const toast = page.locator(".toast", { hasText: /Cancelled Undo Test/ });
  await expect(toast).toBeVisible();
  await expect(page.locator(".cal-card.tone-gone", { hasText: name }).first()).toBeVisible();

  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".toast-text", { hasText: /Put Undo Test .* back/ })).toBeVisible();
  await expect(
    page.locator(".cal-card:not(.tone-gone):not(.tone-missed)", { hasText: name }),
  ).toHaveCount(1);
  expect(auditCount("%undoCancel%")).toBeGreaterThan(0);
});

test("late entry on a closed day needs a reason and shows on that day", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Late Test ${stamp}`;
  await loginDeskWithDoctor(page);
  await registerPatient(page, name, stamp);
  // The next Sunday: the clinic is closed on Sundays by default.
  let sunday = isoDate(1);
  while (new Date(`${sunday}T12:00:00Z`).getUTCDay() !== 0) {
    sunday = new Date(Date.parse(`${sunday}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  }
  // The popover: a closed day is a soft rule, so the server asks; "Book anyway" needs a reason.
  await page.goto(`/app/appointments?date=${sunday}&view=day`);
  await page.getByRole("button", { name: "Book Appointment" }).click();
  const pop = bookPopover(page);
  await pop.getByLabel("Search patient name, code or phone").fill(name);
  await pop.locator(".bk-results [role=option]").first().click();
  if (!(await pop.locator(".bk-doctor.is-on").count()))
    await pop.locator(".bk-doctor").first().click();
  await pop.getByLabel("Date", { exact: true }).fill(sunday);
  await pop.getByLabel("Start Time").fill("11:00");
  await pop.getByRole("button", { name: "Book Appointment" }).click();
  await expect(pop.getByRole("alert")).toContainText("closed");
  await pop.getByRole("button", { name: "Book anyway" }).click();
  await pop.getByRole("button", { name: "Book Appointment" }).click();
  await expect(pop.getByRole("alert")).toContainText("Write a short reason.");
  await pop.getByLabel(/Reason to book anyway/).fill("Fake: emergency, doctor agreed");
  await pop.getByRole("button", { name: "Book Appointment" }).click();
  await expect(pop).toBeHidden();

  await page.goto(`/app/appointments?date=${sunday}&view=day`);
  await expect(page.locator(".cal-card", { hasText: name })).toHaveAttribute(
    "aria-label",
    /Overbooked/,
  );
  expect(auditCount("%Fake: emergency, doctor agreed%")).toBeGreaterThan(0);
});
