import { expect, type Page } from "@playwright/test";

// Shared by the calendar specs. Fake data only.

export function isoDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

export async function registerPatient(page: Page, name: string, stamp: string) {
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Female", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("30");
  await page.getByLabel("Mobile", { exact: true }).fill(`9000${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
}

/** The booking popover (final calendar design), whichever page opened it. */
export const bookPopover = (page: Page) =>
  page.getByRole("dialog", { name: /Schedule Appointment|Move appointment/ });

/**
 * In an open booking popover: choose the first doctor (the desk must choose; a doctor is set),
 * then try 10:30 AM on the next open day from `fromDay` on. Returns the booked date.
 */
export async function bookInPopover(page: Page, fromDay = 1, startTime = "10:30"): Promise<string> {
  const pop = bookPopover(page);
  await expect(pop).toBeVisible();
  if (!(await pop.locator(".bk-doctor.is-on").count()))
    await pop.locator(".bk-doctor").first().click();
  const date = await openDay(page, fromDay, startTime);
  await pop.getByLabel("Date", { exact: true }).fill(date);
  await pop.getByLabel("Start Time").fill(startTime);
  await pop.getByRole("button", { name: /Book Appointment|Move appointment/ }).click();
  await expect(pop).toBeHidden({ timeout: 8000 });
  return date;
}

/** First day from `fromDay` on whose opening hours hold `time` + 30 min (one range request). */
export async function openDay(page: Page, fromDay: number, time: string): Promise<string> {
  const [h, m] = time.split(":").map(Number) as [number, number];
  const start = h * 60 + m;
  const res = await page.request.get(
    `/api/staff/appointments/range?from=${isoDate(fromDay)}&to=${isoDate(fromDay + 6)}`,
  );
  const body = (await res.json()) as {
    data: {
      days: { dateLocal: string; window: { closed: boolean; intervals: [number, number][] } }[];
    };
  };
  const day = body.data.days.find(
    (d) => !d.window.closed && d.window.intervals.some(([a, b]) => a <= start && start + 30 <= b),
  );
  if (!day) throw new Error("No open day to book in the next week.");
  return day.dateLocal;
}

/** Books a coming day from the page's "Book appointment" button or link; returns that date. */
export async function bookFutureSlot(page: Page): Promise<string> {
  await page
    .getByRole("button", { name: "Book appointment" })
    .or(page.getByRole("link", { name: "Book appointment" }))
    .first()
    .click();
  const date = await bookInPopover(page);
  await expect(page.locator(".cal-toast")).toContainText(/Booked for|Appointment confirmed/);
  return date;
}
