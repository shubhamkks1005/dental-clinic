import { expect, test } from "@playwright/test";

// Q2.13 Library: add drawer, filter chips, Reorder mode, columns. Design: Library.dc.html,
// LibraryAdd.dc.html, PhoneLibrary.dc.html. Fake data only.
const stamp = Date.now().toString().slice(-6);

test("add drawer: short form, Save and add another, focus returns, Esc closes", async ({
  page,
}) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/library/medicines");
  const opener = page.getByRole("button", { name: "+ Add medicine" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const drawer = page.locator("dialog[open]");
  await expect(drawer.getByRole("heading", { name: "Add medicine" })).toBeVisible();
  // focus is inside the drawer, and "More details" starts closed
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog[open]"))).toBe(true);
  await expect(drawer.locator("details")).not.toHaveAttribute("open", "");
  await expect(drawer.getByRole("button", { name: "Save medicine" })).toBeDisabled();

  await drawer.getByLabel("Medicine name").fill(`Fake Drawermed ${stamp}`);
  await drawer.getByLabel("Strength").fill("400 mg");
  await drawer.getByLabel("Capsule").check({ force: true });
  await drawer.getByRole("button", { name: "Save and add another" }).click();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByLabel("Medicine name")).toHaveValue("");
  await expect(drawer.getByLabel("Medicine name")).toBeFocused();
  await drawer.getByLabel("Medicine name").fill(`Fake Drawermed2 ${stamp}`);
  await drawer.getByLabel("Strength").fill("5 ml");
  await drawer.getByRole("button", { name: "Save medicine" }).click();
  await expect(drawer).toBeHidden();
  await expect(opener).toBeFocused();

  await page.getByRole("searchbox").fill(`Fake Drawermed`);
  // Both are in the list, added by the doctor here, so no DRAFT badge on them.
  const row = page.locator("li.library-row", { hasText: `Fake Drawermed ${stamp}` });
  await expect(row).toContainText("Capsule · 400 mg");
  await expect(row).toContainText("As directed");
  await expect(row.getByText("DRAFT - doctor to confirm")).toHaveCount(0);

  // Esc closes and focus goes back to the opener.
  await opener.click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("filter chips, Hide, Reorder mode and the per-list columns", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/library/medicines");
  await page.getByRole("button", { name: "+ Add medicine" }).click();
  const drawer = page.locator("dialog[open]");
  await drawer.getByLabel("Medicine name").fill(`Fake Chipmed ${stamp}`);
  await drawer.getByLabel("Strength").fill("10 mg");
  await drawer.getByRole("button", { name: "Save medicine" }).click();
  await expect(drawer).toBeHidden();
  await page.getByRole("searchbox").fill(`Fake Chipmed ${stamp}`);

  await expect(page.getByText("Used, 30 days")).toBeVisible();
  // Hide it: it leaves All-visible rows? It stays in All, shows a Hidden badge, and is under Hidden.
  const row = page.locator("li.library-row", { hasText: `Fake Chipmed ${stamp}` });
  await row.getByRole("button", { name: `Hide Fake Chipmed ${stamp}` }).click();
  await expect(row).toContainText("Hidden");
  await page.getByRole("button", { name: /^Hidden \d+/ }).click();
  await expect(row).toBeVisible();
  await page.getByRole("button", { name: /^Needs review/ }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole("button", { name: /^All \d+/ }).click();

  // Up and down arrows exist only in Reorder mode.
  await expect(page.getByRole("button", { name: /^Move .* up$/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Reorder" }).click();
  await expect(page.getByRole("button", { name: /^Move .* up$/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^Edit / })).toHaveCount(0);
  await page.getByRole("button", { name: "Done reordering" }).click();
  await expect(page.getByRole("button", { name: /^Move .* up$/ })).toHaveCount(0);

  // Procedures show the fee in rupees, visit types show minutes and a colour swatch.
  await page.goto("/app/library/procedures");
  await expect(page.getByText("Usual fee").first()).toBeVisible();
  await page.goto("/app/library/visit_types");
  await expect(page.locator("li.library-row").first()).toContainText("minutes");
  await expect(page.locator("li.library-row .item-colour-swatch").first()).toBeVisible();
});

test("receptionist has no Library page and no medicine usage numbers", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app");
  await expect(page.getByRole("link", { name: "Library" })).toHaveCount(0);
  const res = await page.request.get("/api/staff/library/medicine-usage");
  expect(res.status()).toBe(403);
});

test("Library at 360, 768 and 1366: no sideways scroll, targets at least 44 px", async ({
  page,
}) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  for (const [w, h] of [
    [360, 780],
    [768, 1024],
    [1366, 768],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/app/library/medicines");
    await expect(page.locator("li.library-row").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    const small = await page.evaluate(
      () =>
        [...document.querySelectorAll("main button, main a, main input")]
          .filter((e) => (e as HTMLElement).offsetParent !== null)
          .filter((e) => !e.closest("details:not([open])"))
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.width > 0 && r.height < 44).length,
    );
    expect(small, `targets under 44px high at ${w}`).toBe(0);
    await page.screenshot({
      path: `docs/ui-audit/screenshots/redesign/Q2.13/${w === 360 ? "PhoneLibrary" : "Library"}${w === 768 ? "-768" : ""}.png`,
    });
    if (w !== 768) {
      await page.getByRole("button", { name: "+ Add medicine" }).click();
      await page.screenshot({
        path: `docs/ui-audit/screenshots/redesign/Q2.13/${w === 360 ? "PhoneLibraryAdd" : "LibraryAdd"}.png`,
      });
      await page.keyboard.press("Escape");
    }
  }
});
