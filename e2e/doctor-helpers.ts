import { expect, type Page } from "@playwright/test";

/**
 * The doctor's Today (Part T): put the named patient in the chair with Start (confirming "ahead of
 * Next" if asked), then press Open visit on the In chair card. Used by the older specs.
 */
/** The scratch database is shared by every spec (and a server from an earlier run may still be up): finish whoever is in the chair. */
export async function completeOthersInChair(page: Page, keepName: string): Promise<boolean> {
  let changed = false;
  const headers = {
    origin: "http://localhost:8787",
    "x-clinic-request": "1",
    "content-type": "application/json",
  };
  const day = await page.request.get("/api/staff/appointments");
  const body = (await day.json()) as {
    data?: {
      appointments?: { id: string; status: string; version: number; patientName: string }[];
    };
  };
  for (const a of body.data?.appointments ?? []) {
    if (a.status === "in_chair" && a.patientName !== keepName) {
      changed = true;
      await page.request.patch(`/api/staff/appointments/${a.id}/status`, {
        headers,
        data: { status: "completed", version: a.version },
      });
    }
  }
  return changed;
}

export async function openVisitFromToday(page: Page, name: string) {
  const chair = page.getByRole("region", { name: "Current patient in chair" });
  if (!(await chair.filter({ hasText: name }).count())) {
    if (await completeOthersInChair(page, name)) await page.reload();
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

/** The dock floats over the lower cards: fold it to its bubble, as the doctor would. */
export async function foldDock(page: Page) {
  const fold = page.getByRole("button", { name: "Minimize to bottom-left circle" });
  if (await fold.isVisible().catch(() => false)) await fold.click();
}

/** Opens one accordion of the visit page (chart, diag, rx, more) unless it is already open. */
export async function openAccordion(page: Page, id: "chart" | "diag" | "rx" | "more") {
  await foldDock(page);
  const details = page.locator(`details#vd-acc-${id}`);
  await details.waitFor({ state: "attached" });
  if (!(await page.locator(`details#vd-acc-${id}[open]`).count())) {
    await details.locator("> summary").click();
  }
  await expect(page.locator(`details#vd-acc-${id}[open]`)).toHaveCount(1);
}

/** Adds the first procedure the search offers for `text` (Enter takes the top row). */
export async function addProcedure(page: Page, text = "Scal") {
  await openAccordion(page, "diag");
  const search = page.getByRole("combobox", { name: "Search procedure or code" });
  const before = await page.locator('[data-line="procedure"]').count();
  await search.fill(text);
  await search.press("Enter");
  await expect(page.locator('[data-line="procedure"]')).toHaveCount(before + 1);
}
