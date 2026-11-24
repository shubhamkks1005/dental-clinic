import { expect, type Page } from "@playwright/test";

/**
 * The doctor's Today (Part T): put the named patient in the chair with Start (confirming "ahead of
 * Next" if asked), then press Open visit on the In chair card. Used by the older specs.
 */
export async function openVisitFromToday(page: Page, name: string) {
  const chair = page.getByRole("region", { name: "Current patient in chair" });
  if (!(await chair.filter({ hasText: name }).count())) {
    await page
      .locator("li.td-row", { hasText: name })
      .getByRole("button", { name: "Start" })
      .click();
    const confirm = page.getByRole("alertdialog");
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.getByRole("button", { name: "Start visit" }).click();
    }
    await expect(chair).toContainText(name, { timeout: 10_000 });
  }
  await chair.getByRole("button", { name: "Open visit" }).click();
}
