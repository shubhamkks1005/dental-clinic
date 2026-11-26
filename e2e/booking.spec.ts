import { expect, test } from "@playwright/test";
import { bookFutureSlot } from "./calendar-helpers";

// Q0.4: booking with the optional note left empty must work (C4: "expected string, received null").

test("receptionist books a future slot with the note empty", async ({ page }) => {
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);

  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(`Book Test ${stamp}`);
  await page.getByLabel("Female", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("30");
  await page.getByLabel("Mobile", { exact: true }).fill(`9000${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();

  // The booking popover opens with the patient set; the note stays empty on purpose.
  await bookFutureSlot(page);
  expect(bad, bad.join("\n")).toEqual([]);
});
