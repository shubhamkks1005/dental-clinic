import { expect, test } from "@playwright/test";

// 9.2.5 / 8.2.11 smoke. Local dev-login stub, fake staff and fake data only.

test.describe("error log and patient requests smoke", () => {
  test("a reported browser error shows in the doctor's error log", async ({ page }) => {
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    await expect(page).toHaveURL(/\/app\/?$/);
    const sent = await page.evaluate(async () => {
      const res = await fetch("/api/staff/errors", {
        method: "POST",
        headers: { "content-type": "application/json", "x-clinic-request": "1" },
        body: JSON.stringify({ kind: "SmokeError", message: "smoke test error", path: "/app" }),
      });
      return res.status;
    });
    expect(sent).toBe(201);
    await page.goto("/app/errors");
    await expect(page.getByRole("heading", { name: "Error log" })).toBeVisible();
    await expect(page.getByText("SmokeError").first()).toBeVisible();
  });

  test("receptionist cannot read the error log", async ({ page }) => {
    await page.goto("/api/staff/auth/dev-login?role=receptionist");
    await page.goto("/app/errors");
    await expect(page.getByText(/You do not have permission to open this page/)).toBeVisible();
    await expect(page.getByText("SmokeError")).toHaveCount(0);
  });

  test("doctor and receptionist open the patient requests list", async ({ page }) => {
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    await page.goto("/app/requests");
    await expect(page.getByRole("heading", { name: "Patient requests" })).toBeVisible();
    await page.goto("/api/staff/auth/dev-login?role=receptionist");
    await page.goto("/app/requests");
    await expect(page.getByRole("heading", { name: "Patient requests" })).toBeVisible();
    await expect(page.getByText("Only the doctor can open and close requests.")).toBeVisible();
  });
});
