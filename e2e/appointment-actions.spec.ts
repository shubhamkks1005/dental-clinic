import { DatabaseSync } from "node:sqlite";
import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  bookFutureSlot,
  bookPopover,
  registerPatient,
  loginDeskWithDoctor,
} from "./calendar-helpers";

// Q1.4: Reschedule, Cancel with a reason, Missed with a reason, blockers named on Close day.
// Fake data only. Any 4xx/5xx from the API fails the test.

const D1_DIR = "apps/worker/.wrangler/e2e-state/v3/d1/miniflare-D1DatabaseObject";

/** IST minutes since midnight now. */
function istNowMinutes(): number {
  const ist = new Date(Date.now() + 330 * 60_000);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

/**
 * Moves the patient's scheduled booking to a past time (dayOffset 0 = today, -1 = yesterday),
 * so Missed is allowed: the real rule waits 15 minutes after the start. Yesterday works at any
 * time of day; today 00:00 needs the clock to be past 00:20 IST.
 */
function moveBookingToPast(patientName: string, dayOffset: number, startMin: number) {
  const file = readdirSync(D1_DIR).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
  const db = new DatabaseSync(`${D1_DIR}/${file}`);
  const ist = new Date(Date.now() + 330 * 60_000 + dayOffset * 86_400_000);
  const dateLocal = ist.toISOString().slice(0, 10);
  const hh = String(Math.floor(startMin / 60)).padStart(2, "0");
  const mm = String(startMin % 60).padStart(2, "0");
  const startAt = new Date(`${dateLocal}T${hh}:${mm}:00+05:30`);
  db.prepare(
    `UPDATE appointments SET date_local = ?, start_min = ?, end_min = ?, start_at = ?
     WHERE patient_id = (SELECT id FROM patients WHERE full_name = ?) AND status = 'scheduled'`,
  ).run(dateLocal, startMin, startMin + 15, startAt.toISOString(), patientName);
  db.close();
  return dateLocal;
}

test("reschedule, cancel with a reason, missed with a reason", async ({ page }) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const name = `Action Test ${stamp}`;
  await loginDeskWithDoctor(page);
  await registerPatient(page, name, stamp);
  const bookedDate = await bookFutureSlot(page);
  await page.goto(`/app/appointments?date=${bookedDate}&view=day`);

  // ---- Calendar panel: Reschedule opens the booking popover in move mode, patient locked ----
  const card = page.locator(".cal-card", { hasText: name });
  await card.click();
  const panel = page.getByLabel("Appointment details");
  await panel.getByRole("button", { name: "Reschedule" }).click();
  const pop = bookPopover(page);
  await expect(pop.getByRole("heading", { name: "Move appointment" })).toBeVisible();
  await expect(pop).toContainText(name);
  await expect(pop.getByRole("button", { name: "Change" })).toHaveCount(0);
  // Same day, a later time.
  await pop.getByLabel("Start Time").fill("16:00");
  await pop.getByRole("button", { name: "Move appointment" }).click();
  await expect(page.locator(".cal-toast")).toContainText("Moved to");
  const dialog = page.locator("dialog[open]");

  // Missed is not offered yet for a future booking (the 15 minute rule).
  // Wait for the refresh: the old booking now reads Moved.
  await expect(page.locator(".cal-card.tone-gone", { hasText: name })).toHaveCount(1);
  const moved = page.locator(".cal-card:not(.tone-gone):not(.tone-missed)", { hasText: name });
  await expect(moved).toHaveCount(1);
  await moved.click();
  await expect(page.getByLabel("Appointment details")).toContainText("Booked");
  await expect(
    page.getByLabel("Appointment details").getByRole("button", { name: "Missed (later)" }),
  ).toBeDisabled();

  const profileHref =
    (await panel.getByRole("link", { name: "Open profile" }).getAttribute("href")) ?? "";

  // ---- Cancel needs a reason; the card is greyed afterwards ----
  await page
    .getByLabel("Appointment details")
    .getByRole("button", { name: "Cancel appointment" })
    .click();
  await dialog.getByLabel("Reason").selectOption({ label: "Other" });
  await expect(dialog.getByRole("button", { name: "Cancel appointment" })).toBeDisabled();
  await dialog.getByLabel("Note").fill("Fake: patient is travelling");
  await dialog.getByRole("button", { name: "Cancel appointment" }).click();
  await expect(page.locator(".toast-text", { hasText: /Cancelled Action Test/ })).toBeVisible();
  await expect(page.locator(".cal-card.tone-gone", { hasText: name })).toHaveCount(2);
  await expect(
    page.locator(".cal-card:not(.tone-gone):not(.tone-missed)", { hasText: name }),
  ).toHaveCount(0);

  // ---- Patient Appointments tab shows the reason ----
  await page.goto(profileHref);
  await page.getByRole("tab", { name: "Appointments", exact: true }).click();
  await expect(page.getByText(/Cancel: Other: Fake: patient is travelling/)).toBeVisible();

  // ---- Missed (any time of day): a booking from yesterday, marked from the calendar panel ----
  await bookFutureSlot(page);
  const yesterday = moveBookingToPast(name, -1, 23 * 60);
  await page.goto(`/app/appointments?date=${yesterday}&view=day`);
  await page.locator(".cal-card", { hasText: name }).click();
  await page
    .getByLabel("Appointment details")
    .getByRole("button", { name: "Missed", exact: true })
    .click();
  await expect(dialog.getByRole("button", { name: "Mark missed" })).toBeDisabled();
  await dialog.getByLabel("Why did they miss it?").fill("Fake: did not answer the phone");
  await dialog.getByRole("button", { name: "Mark missed" }).click();
  await expect(page.locator(".toast-text", { hasText: /marked as missed/ })).toBeVisible();
  await page.goto(profileHref);
  await page.getByRole("tab", { name: "Appointments", exact: true }).click();
  await expect(page.getByText(/Cancel: .*Fake: did not answer the phone/)).toBeVisible();

  // ---- Today: Call list and Close day blockers. Needs today 00:15 to be in the past. ----
  if (istNowMinutes() < 20) {
    test.info().annotations.push({
      type: "note",
      description: "Today's To follow up and Close-day part skipped: it is before 00:20 IST.",
    });
    return expect(bad, bad.join("\n")).toEqual([]);
  }
  await bookFutureSlot(page);
  moveBookingToPast(name, 0, 0);
  await page.goto("/app");
  const row = page.locator("li.today-row", { hasText: name });
  await expect(row).toBeVisible();
  await page.goto("/app/billing?tab=close");
  await expect(page.getByRole("link", { name })).toBeVisible();
  await page.goto("/app");
  await row.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Missed" }).click();
  await dialog.getByLabel("Why did they miss it?").fill("Fake: did not answer the phone");
  await dialog.getByRole("button", { name: "Mark missed" }).click();
  await expect(page.locator(".toast-text", { hasText: /marked as missed/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "To follow up" })).toContainText(name);

  expect(bad, bad.join("\n")).toEqual([]);
});
