import { expect, test, type Page } from "@playwright/test";
import { addProcedure } from "./doctor-helpers";

// Visit finished page (docs/design/handoff/visit-finished.md, section 10). Fake data only.
// The visit is opened through the API (no Today steps), the rest through the screen.

const H = { origin: "http://localhost:8787", "x-clinic-request": "1" };
const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

async function freshVisit(page: Page, name: string, stamp: string) {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  const p = await page.request.post("/api/staff/patients", {
    headers: H,
    data: { fullName: name, gender: "female", ageYearsAtReg: 31, mobile: `9002${stamp}` },
  });
  expect(p.status(), await p.text()).toBeLessThan(300);
  const patientId = ((await p.json()) as { data: { patient: { id: string } } }).data.patient.id;
  const v = await page.request.post("/api/staff/visits", {
    headers: H,
    data: { patientId, visitDateLocal: today() },
  });
  expect(v.status(), await v.text()).toBeLessThan(300);
  const visitId = ((await v.json()) as { data: { visit: { id: string } } }).data.visit.id;
  return { patientId, visitId };
}

async function finalise(page: Page) {
  await page.getByRole("button", { name: "Finalise visit" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Finalise", exact: true }).click();
  await expect(page).toHaveURL(/\/finished$/);
}

test("Finalise opens the page; Save, Edit, Lock with confirm; one number", async ({ page }) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 500) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const { visitId } = await freshVisit(page, `Finished Fake ${stamp}`, stamp);
  await page.goto(`/app/visits/${visitId}`);
  await expect(page.getByLabel("Chief Complaints", { exact: true })).toBeVisible();
  await page.getByLabel("Chief Complaints", { exact: true }).fill("Fake: scaling");
  await addProcedure(page);
  await finalise(page);

  await expect(page.getByRole("heading", { name: "Visit finished" })).toBeVisible();
  await expect(page.getByText(/Visit finalised .* The visit is now read only\./)).toBeVisible();
  await expect(page.getByText("Today's details")).toBeVisible();
  const invoice = page.locator("section.vf-invoice");
  await expect(invoice.getByText("Draft", { exact: true })).toBeVisible();
  await expect(invoice.getByText("Nothing paid at arrival")).toBeVisible();

  // Saved draft opens read only: Edit, change the amount, Save (3 rounds), then Lock.
  for (const amount of ["700", "750", "800"]) {
    await invoice.getByRole("button", { name: "Edit" }).click();
    await invoice.getByLabel("Amount in rupees").first().fill(amount);
    await invoice.getByRole("button", { name: "Save", exact: true }).click();
    await expect(invoice.getByText("Saved", { exact: true })).toBeVisible();
  }
  await expect(invoice.locator(".vf-total-num")).toHaveText("₹800");
  await expect(invoice.getByText("Remaining", { exact: true })).toBeVisible();

  // Pass asks once; Cancel changes nothing; Confirm locks with one number.
  await invoice.getByRole("button", { name: /Pass to reception/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
  await expect(invoice.getByText("Draft", { exact: true })).toBeVisible();
  await invoice.getByRole("button", { name: /Pass to reception/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirm" }).click();
  await expect(invoice.getByText("With reception")).toBeVisible();
  await expect(invoice.getByRole("button", { name: /Passed to reception/ })).toBeDisabled();
  await expect(invoice.locator(".vf-mono").filter({ hasText: /^S?B-/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open full invoice" })).toBeVisible();

  // No sideways scroll at 768 and 360.
  for (const width of [768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  expect(bad, bad.join("\n")).toEqual([]);
});

test("a visit with no procedure says nothing to invoice; the desk sees Doctor access only", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const stamp = (Number(Date.now().toString().slice(-6)) + 7).toString().padStart(6, "0");
  const { visitId } = await freshVisit(page, `Finished Empty ${stamp}`, stamp);
  await page.goto(`/app/visits/${visitId}`);
  await page.getByLabel("Chief Complaints", { exact: true }).fill("Fake: check-up");
  await finalise(page);
  await expect(page.getByText("Nothing to invoice on this visit.")).toBeVisible();
  await expect(page.getByText("No prescription for this visit.")).toBeVisible();

  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto(`/app/visits/${visitId}/finished`);
  await expect(page.getByRole("heading", { name: "Doctor access only" })).toBeVisible();
  await expect(page.getByText("Today's details")).toHaveCount(0);
});
