import { expect, test } from "@playwright/test";

// S3.1.1: lazy screens. A chunk that cannot download (a new deploy renamed the file) must show the
// Reload page inside the app frame, not a blank screen; CSP must not block same-origin chunks.
test.describe("lazy screens (S3.1.1)", () => {
  test("lazy screens load with no console or CSP errors", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "Settings" }).first()).toBeVisible();
    await page.goto("/app/print/sample?lines=2");
    await expect(page.getByRole("heading", { name: "Printer check" })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("a missing chunk shows the Reload page, and the menu stays", async ({ page }) => {
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    await expect(page).toHaveURL(/\/app\/?$/);
    await page.route(/\/assets\/ReportsScreen-.*\.js/, (route) => route.abort());
    await page
      .getByRole("link", { name: /reports/i })
      .first()
      .click();
    await expect(page.getByText("Something went wrong on this page")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reload" })).toBeVisible();
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });
});
