import { expect, test } from "@playwright/test";

/**
 * 4.5.1: regression for sample English prescriptions with 1..8 medicines.
 * Compares the printable sheet text (stable across OS; pixel diffs are flaky Mac vs CI linux).
 */
test.describe("print regression (4.5.1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    await expect(page).toHaveURL(/\/app\/?$/);
  });

  for (const lines of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
    test(`sample Rx with ${lines} medicine line(s)`, async ({ page }) => {
      await page.goto(`/app/print/sample?lines=${lines}`);
      await expect(page.getByRole("heading", { name: "Printer check" })).toBeVisible();
      const sheet = page.locator(".print-page");
      await expect(sheet).toBeVisible();
      await expect(sheet.locator(".rx-table tbody tr")).toHaveCount(lines);
      await expect(sheet.getByText("Sample Patient")).toBeVisible();
      await expect(sheet.locator(".rx-table")).toContainText("Fake");
      // English-only sample body; snapshot catches layout/text regressions in CI.
      const text = (await sheet.innerText()).replace(/\s+/g, " ").trim();
      expect(text).toMatchSnapshot(`rx-${lines}-meds.txt`);
    });
  }
});
