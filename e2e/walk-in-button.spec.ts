import { expect, test } from "@playwright/test";

// Q1.9: the top bar's Walk-in works from any page, and Today shows only one Walk-in button.
test("top-bar Walk-in opens the walk-in dialog from another page", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients");
  await page.getByRole("link", { name: "Walk-in" }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Walk-in" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Walk-in" })).toHaveCount(0);
});
