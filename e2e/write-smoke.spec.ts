import { expect, test } from "@playwright/test";

// Q0.1: proves a WRITE works through the browser (CSRF origin, JSON body, audit). Fake data only.

test.describe("write smoke (Q0.1)", () => {
  test("receptionist creates a patient through the form", async ({ page }) => {
    await page.goto("/api/staff/auth/dev-login?role=receptionist");
    await expect(page).toHaveURL(/\/app\/?$/);

    await page.goto("/app/patients/new");
    const stamp = Date.now().toString().slice(-6);
    await page.getByLabel("Full name").fill(`Smoke Test ${stamp}`);
    await page.getByLabel("Gender").selectOption("female");
    await page.getByLabel("Or age (years)").fill("30");
    // Obviously fake number, unique per run so the duplicate warning does not block.
    await page.getByLabel("Mobile", { exact: true }).fill(`9000${stamp}`);
    await page.getByRole("button", { name: "Save patient" }).click();

    await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
  });
});
