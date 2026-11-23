import { expect, test, type Page } from "@playwright/test";

// Q2.1: the sidebar has 8 items for the doctor, 7 for the receptionist; every screen starts at
// the same gutter; the sidebar works with the keyboard only.
const SIZES = [
  { name: "phone", width: 360, gutter: 16 },
  { name: "tablet", width: 768, gutter: 24 },
  { name: "laptop", width: 1366, gutter: 24 },
];

async function titleLeft(page: Page) {
  return page.evaluate(() => {
    const h1 = document.querySelector("main h1")!.getBoundingClientRect();
    return Math.round(
      h1.left - document.querySelector(".shell-main")!.getBoundingClientRect().left,
    );
  });
}

test("doctor sidebar has Library; receptionist does not and cannot open it", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/patients");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveText([
    "Today",
    "Patients",
    "Appointments",
    "Billing",
    "Messages",
    "Reports",
    "Library",
    "Settings",
  ]);
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients");
  await expect(nav.getByRole("link")).toHaveCount(7);
  await page.goto("/app/library");
  await expect(page.getByRole("heading", { name: "Library" })).toHaveCount(0);
});

for (const size of SIZES) {
  test(`same page gutter at ${size.name} (${size.width}px), no sideways scroll`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: size.width, height: 800 });
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    for (const path of [
      "/app/patients",
      "/app/appointments",
      "/app/billing",
      "/app/messages",
      "/app/reports",
      "/app/settings",
      "/app/library",
    ]) {
      await page.goto(path);
      await expect(page.locator("main h1").first()).toBeVisible();
      expect(await titleLeft(page), path).toBe(size.gutter);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        path,
      ).toBe(true);
    }
  });
}

test("keyboard only: Tab reaches the sidebar and Enter opens Library", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/patients");
  const library = page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Library" });
  await library.focus();
  await expect(library).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/app\/library$/);
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
});
