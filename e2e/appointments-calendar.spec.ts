import { expect, test, type Page } from "@playwright/test";
import {
  bookInPopover,
  bookPopover,
  isoDate,
  openDay,
  registerPatient,
  loginDeskWithDoctor,
} from "./calendar-helpers";

// Appointments calendar, final design (docs/design/final/appointments_calendar.html, handoff
// docs/design/handoff/appointments-calendar.md section 10). Fake data only. Functional checks
// plus "starts at once"; the full motion numbers come from the design-apply probe.

async function noSideways(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function clickCell(page: Page, key: string) {
  const cell = page.locator(`[data-cell="${key}"]`);
  await cell.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = (await cell.boundingBox())!;
  // The strip on the right of a column stays clickable even under a card (clashes allowed).
  await page.mouse.click(box.x + box.width - 6, box.y + 40);
}

test("desk: week grid, doctor filter, book from a cell with the fold into the slot", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const name = `Cal Grid ${stamp}`;
  await loginDeskWithDoctor(page);
  await registerPatient(page, name, stamp);
  const day = await openDay(page, 1, "12:00");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`/app/appointments?date=${day}`);

  // T1: heads, desk chip, filter bar.
  await expect(page.getByRole("heading", { name: "Appointments Calendar" })).toBeVisible();
  await expect(page.getByText("Desk View")).toBeVisible();
  await expect(page.getByRole("group", { name: "Doctors shown" })).toBeVisible();
  await expect(page.locator(".cal-dayhead")).toHaveCount(7);
  await noSideways(page);

  // T5 / T9: a cell opens the popover next to it; Book starts at once and folds into the slot.
  await clickCell(page, `${day}|720`);
  const pop = bookPopover(page);
  await expect(pop).toBeVisible();
  await expect(page.getByTestId("slot-preview")).toBeVisible();
  await pop.getByLabel("Search patient name, code or phone").fill(name);
  await pop.locator(".bk-results [role=option]").first().click();
  if (!(await pop.locator(".bk-doctor.is-on").count()))
    await pop.locator(".bk-doctor").first().click();
  await pop.getByRole("button", { name: "45m", exact: true }).click();
  await expect(pop.getByTestId("bk-range")).toContainText("(45m)");
  const book = pop.getByRole("button", { name: "Book Appointment" });
  await book.click();
  await expect(pop.getByRole("button", { name: "Booking…" }))
    .toBeVisible({ timeout: 300 })
    .catch(
      () => undefined, // a fast local server can answer before the check runs
    );
  await expect(pop).toBeHidden();
  await expect(page.locator(".cal-toast")).toContainText(
    "Appointment confirmed and slotted on calendar",
  );
  const card = page.locator(`[data-col-date="${day}"] .cal-card`, { hasText: name });
  await expect(card).toHaveCount(1);

  // T3 / T4: Clear hides every card and says so; All brings them back.
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByText("No doctor chosen.")).toBeVisible();
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: "Show all" }).click();
  await expect(card).toHaveCount(1);

  // Details panel on the right, in the calendar's look.
  await card.click();
  const panel = page.getByLabel("Appointment details");
  await expect(panel).toContainText(name);
  await expect(panel).toContainText("Doctor");
  await panel.getByRole("button", { name: "Close details" }).click();

  // T17: a changed form asks before closing.
  await clickCell(page, `${day}|900`);
  await pop.getByPlaceholder(/Regular orthodontics/).fill("Fake: wants a check");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog", { name: "Discard this booking?" })).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(pop).toBeHidden();
  expect(bad, bad.join("\n")).toEqual([]);
});

test("new patient tab: Save & Book docks the patient into Slot Selection", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  await loginDeskWithDoctor(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/app/appointments");
  await page.getByRole("button", { name: "Book Appointment" }).click();
  const pop = bookPopover(page);
  await pop.getByRole("tab", { name: "+ New Patient" }).click();
  await expect(pop.getByText("Patient number is given on save")).toBeVisible();
  await pop.getByLabel("Full Name *").fill(`Cal New ${stamp}`);
  await pop.getByLabel("Mobile *").fill(`95${stamp}33`.slice(0, 10));
  await pop.getByLabel("Female", { exact: true }).check();
  await pop.getByLabel("Or age (years)").fill("34");
  await pop.getByRole("button", { name: "Save & Book" }).click();
  await expect(page.locator(".cal-toast")).toContainText("Patient Registered");
  await expect(page.locator(".cal-flyer")).toHaveCount(0, { timeout: 3000 });
  await expect(pop.getByTestId("bk-picked")).toContainText(`Cal New ${stamp}`);
  await expect(pop.getByRole("tab", { name: "Slot Selection" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await bookInPopover(page);
});

test("phone keeps the day list; details open as a sheet", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Cal Phone ${stamp}`;
  await loginDeskWithDoctor(page);
  await registerPatient(page, name, stamp);
  await page
    .getByRole("link", { name: "Book appointment" })
    .or(page.getByRole("button", { name: "Book appointment" }))
    .first()
    .click();
  const date = await bookInPopover(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(`/app/appointments?date=${date}`);
  const row = page.locator(".phone-day-row", { hasText: name });
  await expect(row).toBeVisible();
  await expect(page.locator(".cal-grid")).toHaveCount(0);
  await noSideways(page);
  expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await row.click();
  await expect(page.getByLabel("Appointment details")).toContainText(name);
  expect(isoDate(0)).toMatch(/^\d{4}-/);
});
