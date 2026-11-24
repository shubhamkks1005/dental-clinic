import { expect, test } from "@playwright/test";

// Q2.12 gap: Payments and Refunds are two lines, never one negative "Collected".
test("receptionist Today summary and doctor Reports show Payments and Refunds apart", async ({
  page,
}) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/reports");
  const card = page.locator(".dash-today-summary");
  await expect(card.getByText("Payments", { exact: true })).toBeVisible();
  await expect(card.getByText("Refunds", { exact: true })).toBeVisible();
  await expect(card.getByText("Collected", { exact: true })).toHaveCount(0);
  await expect(card).not.toContainText("-₹");
  const res = await page.request.get("/api/staff/dashboard/today-summary");
  const body = (await res.json()).data;
  expect(body.paymentsPaise).toBeGreaterThanOrEqual(0);
  expect(body.refundsPaise).toBeGreaterThanOrEqual(0);
  expect(Number.isInteger(body.paymentsPaise)).toBe(true);

  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/reports");
  await expect(page.getByText("Payments this month")).toBeVisible();
  await expect(page.getByText(/Refunds ₹[\d,]+\. Net/)).toBeVisible();
  const kpis = (await (await page.request.get("/api/staff/dashboard")).json()).data.kpis;
  expect(kpis.monthPaymentsPaise - kpis.monthRefundsPaise).toBe(kpis.monthCollectedPaise);
});
