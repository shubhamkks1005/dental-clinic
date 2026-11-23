import { DatabaseSync } from "node:sqlite";
import { readdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Q1.4: Reschedule, Cancel with a reason, Missed with a reason, blockers named on Close day.
// Fake data only. Any 4xx/5xx from the API fails the test.

const D1_DIR = "apps/worker/.wrangler/e2e-state/v3/d1/miniflare-D1DatabaseObject";

function isoDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

async function registerPatient(page: Page, name: string, stamp: string) {
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Gender").selectOption("female");
  await page.getByLabel("Or age (years)").fill("30");
  await page.getByLabel("Mobile", { exact: true }).fill(`9000${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
}

/** Books the first free time on one of the next 7 days; returns that date. */
async function bookFutureSlot(page: Page): Promise<string> {
  await page
    .getByRole("button", { name: "Book appointment" })
    .or(page.getByRole("link", { name: "Book appointment" }))
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Visit type").selectOption({ label: "Consultation" });
  const times = dialog.getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ });
  let date = "";
  for (let day = 1; day <= 7; day++) {
    date = isoDate(day);
    await dialog.getByLabel("Date").fill(date);
    await page.waitForTimeout(1200);
    if ((await times.count()) > 0) break;
  }
  await times.first().click();
  await dialog.getByRole("button", { name: "Book", exact: true }).click();
  await expect(page.locator(".toast-text", { hasText: /Booked for/ })).toBeVisible();
  return date;
}

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
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await registerPatient(page, name, stamp);
  const bookedDate = await bookFutureSlot(page);
  await page.goto(`/app/appointments?date=${bookedDate}`);

  // ---- Calendar panel: Reschedule reopens the Book dialog with the patient filled ----
  const card = page.locator(".day-card", { hasText: name });
  await card.click();
  const panel = page.getByLabel("Appointment details");
  await panel.getByRole("button", { name: "Reschedule" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Reschedule appointment")).toBeVisible();
  await expect(dialog).toContainText(name);
  await dialog
    .getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ })
    .last()
    .click();
  await dialog.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.locator(".toast-text", { hasText: /Moved to/ })).toBeVisible();

  // Missed is not offered yet for a future booking (the 15 minute rule).
  await page.locator(".day-card:not(.day-card-muted)", { hasText: name }).click();
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
  await expect(page.locator(".day-card-muted", { hasText: name })).toHaveCount(2);
  await expect(page.locator(".day-card:not(.day-card-muted)", { hasText: name })).toHaveCount(0);

  // ---- Patient Appointments tab shows the reason ----
  await page.goto(profileHref);
  await page.getByRole("tab", { name: "Appointments", exact: true }).click();
  await expect(page.getByText(/Cancel: Other: Fake: patient is travelling/)).toBeVisible();

  // ---- Missed (any time of day): a booking from yesterday, marked from the calendar panel ----
  await bookFutureSlot(page);
  const yesterday = moveBookingToPast(name, -1, 23 * 60);
  await page.goto(`/app/appointments?date=${yesterday}`);
  await page.locator(".day-card", { hasText: name }).click();
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
      description: "Today's Call list and Close-day part skipped: it is before 00:20 IST.",
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
  await expect(page.getByRole("region", { name: "Call list" })).toContainText(name);

  expect(bad, bad.join("\n")).toEqual([]);
});
