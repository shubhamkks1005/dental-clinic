import { expect, test } from "@playwright/test";
import { bookInPopover, bookPopover } from "./calendar-helpers";

// Q1.5: the confirmation is due at once, the reminder waits for 17:00 the day before and shows its
// due time, and moving the booking makes the old messages "out of date". Fake data only.

test("confirm now, reminder scheduled with a due time, move makes old ones out of date", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const name = `Msg Test ${stamp}`;
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Female", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("33");
  await page.getByLabel("Mobile", { exact: true }).fill(`9002${stamp}`);
  await page.getByLabel("Privacy notice given").check();
  await page.getByLabel("Allow reminders").check();
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();

  // Book the first free time on one of the next days.
  await page
    .getByRole("button", { name: "Book appointment" })
    .or(page.getByRole("link", { name: "Book appointment" }))
    .first()
    .click();
  // From day 2: isoDate is UTC, and after midnight IST "day 1" is still today here.
  const date = await bookInPopover(page, 2);

  await page.request.get("/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*");
  await page.goto("/app/messages");
  // One card per patient on the To send tab: the confirmation (now, or later in quiet hours) and
  // the reminder with its due time sit together.
  const items = (kind: string) =>
    page.locator(".msg-patient", { hasText: name }).locator(".msg-item", {
      has: page.locator(".chip", { hasText: new RegExp(`^${kind}$`) }),
    });
  await expect(items("Confirmation")).toHaveCount(1);
  await expect(items("Reminder")).toHaveCount(1);
  await expect(items("Reminder")).toContainText("due ");
  await expect(items("Reminder").getByRole("button", { name: "Not due yet" })).toBeDisabled();

  // Move the booking to the last free time of that day.
  await page.goto(`/app/appointments?date=${date}&view=day`);
  await page.locator(".cal-card", { hasText: name }).click();
  await page.getByLabel("Appointment details").getByRole("button", { name: "Reschedule" }).click();
  // The popover keeps the booking's day; a later time the same day.
  const pop = bookPopover(page);
  await pop.getByLabel("Start Time").fill("17:00");
  await pop.getByRole("button", { name: "Move appointment" }).click();
  await expect(page.locator(".cal-toast")).toContainText("Moved to");

  await page.request.get("/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*");
  await page.goto("/app/messages");
  await page.getByRole("button", { name: /^Out of date/ }).click();
  const out = page.locator(".msg-patient", { hasText: name }).locator(".msg-item");
  await expect(out).toHaveCount(2); // the old confirm and the old reminder
  await expect(out.first()).toContainText("Withdrawn");
  await page.getByRole("button", { name: /^To send/ }).click();
  // Only the new time is live: one moved message, and the old confirm is no longer waiting.
  await expect(items("Moved")).toHaveCount(1);
  await expect(items("Confirmation")).toHaveCount(0);
  await expect(items("Reminder")).toHaveCount(1); // the new time gets its own reminder

  expect(bad, bad.join("\n")).toEqual([]);
});
