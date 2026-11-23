import { expect, test } from "@playwright/test";

// 1.7.3: local Access stub = /api/staff/auth/dev-login. Fake staff only. Keep this suite tiny.

test.describe("staff smoke (1.7.3)", () => {
  test("landing page shows staff sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Clinic staff" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in with Google" })).toBeVisible();
  });

  test("dev doctor reaches Today and can open Staff settings", async ({ page }) => {
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    await expect(page).toHaveURL(/\/app\/?$/);
    await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Today");

    await page.goto("/app/settings/staff");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Settings sections" })).toContainText(
      "Staff",
    );
  });

  test("dev receptionist reaches the app but Staff settings is not available", async ({ page }) => {
    await page.goto("/api/staff/auth/dev-login?role=receptionist");
    await expect(page).toHaveURL(/\/app\/?$/);
    await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Today");

    await page.goto("/app/settings");
    await expect(page.getByRole("navigation", { name: "Settings sections" })).not.toContainText(
      "Staff",
    );

    await page.goto("/app/settings/staff");
    await expect(page.getByText(/You do not have permission to open this page/)).toBeVisible();
  });
});
