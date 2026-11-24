import { expect, test } from "@playwright/test";

// Q1.5: the confirmation is due at once, the reminder waits for 17:00 the day before and shows its
// due time, and moving the booking makes the old messages "out of date". Fake data only.

function isoDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

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
  await page.getByLabel("Gender").selectOption("female");
  await page.getByLabel("Or age (years)").fill("33");
  await page.getByLabel("Mobile", { exact: true }).fill(`9002${stamp}`);
  await page.getByLabel("Privacy notice shown").check();
  await page.getByLabel("SMS reminders allowed").check();
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();

  // Book the first free time on one of the next days.
  await page
    .getByRole("button", { name: "Book appointment" })
    .or(page.getByRole("link", { name: "Book appointment" }))
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Visit type").selectOption({ label: "Consultation" });
  const times = dialog.getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ });
  let date = "";
  for (let day = 1; day <= 8; day++) {
    date = isoDate(day);
    await dialog.getByLabel("Date").fill(date);
    await page.waitForTimeout(1200);
    if ((await times.count()) > 1) break;
  }
  await times.first().click();
  await dialog.getByRole("button", { name: "Book", exact: true }).click();
  await expect(page.locator(".toast-text", { hasText: /Booked for/ })).toBeVisible();

  await page.request.get("/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*");
  await page.goto("/app/messages");
  const card = (section: string) =>
    page
      .getByRole("region", { name: section })
      .locator("li", { hasText: `Dear ${name.split(" ")[0]}` });
  // The confirmation is due at once, or at 08:00 when booked in quiet hours: either way it exists once.
  const live = (kind: string) =>
    card("Send on WhatsApp")
      .filter({ hasText: kind })
      .or(card("Scheduled").filter({ hasText: kind }));
  await expect(live("confirm")).toHaveCount(1);
  const scheduled = card("Scheduled").filter({ hasText: "remind" });
  await expect(scheduled).toHaveCount(1);
  await expect(scheduled).toContainText("due ");

  // Move the booking to the last free time of that day.
  await page.goto(`/app/appointments?date=${date}`);
  await page.locator(".day-card", { hasText: name }).click();
  await page.getByLabel("Appointment details").getByRole("button", { name: "Reschedule" }).click();
  await dialog
    .getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ })
    .last()
    .click();
  await dialog.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.locator(".toast-text", { hasText: /Moved to/ })).toBeVisible();

  await page.request.get("/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*");
  await page.goto("/app/messages");
  const out = page
    .getByRole("region", { name: "Out of date" })
    .locator("li", { hasText: "Dear Msg" });
  await expect(out).toHaveCount(2); // the old confirm and the old reminder
  await expect(out.first()).toContainText("out of date");
  // Only the new time is live: one moved message, and the old confirm is no longer waiting.
  await expect(live("reschedule")).toHaveCount(1);
  await expect(live("confirm")).toHaveCount(0);
  await expect(live("remind")).toHaveCount(1); // the new time gets its own reminder

  expect(bad, bad.join("\n")).toEqual([]);
});
