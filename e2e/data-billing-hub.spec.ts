import { expect, test } from "@playwright/test";

// Q2.3 (file name sorts after core-loop on purpose, specs run in file-name order: it needs the bills that spec creates): Billing hub with four tabs, Bills search, and the Bill screen header. Fake data only.
test("billing hub: four tabs, tab kept in the address, Bills search opens a bill", async ({
  page,
}) => {
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/billing");
  const tabs = page.getByRole("tablist", { name: "Billing sections" });
  await expect(tabs.getByRole("tab")).toHaveText(["Today", "Dues", "Bills", "Day close"]);
  await expect(page.getByRole("tab", { name: "Dues" })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("tab", { name: "Bills" }).click();
  await expect(page).toHaveURL(/tab=bills/);
  await page.getByLabel("Search bills").fill("SB-");
  const first = page.getByRole("region", { name: "Bills" }).getByRole("link").first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/\/app\/bills\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bill SB-");

  await page.goto("/app/billing?tab=close");
  await expect(page.getByText("Cash expected in the drawer")).toBeVisible();
  expect(bad, bad.join("\n")).toEqual([]);
});

test("billing hub works with the keyboard only: arrow keys move between tabs", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/billing");
  await page.getByRole("tab", { name: "Dues" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Bills" })).toBeFocused();
  await expect(page).toHaveURL(/tab=bills/);
});

test("the printed bill has no internal sentences", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/billing?tab=bills");
  await page.getByRole("region", { name: "Bills" }).getByRole("link").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bill SB-");
  const href = (await page.getByRole("link", { name: "Print bill" }).getAttribute("href")) ?? "";
  await page.goto(href);
  await expect(page.getByText(/Bill SB-/).first()).toBeVisible();
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/gst_mode|DRAFT accountant|registration number missing/i);
});
