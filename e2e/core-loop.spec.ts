import { expect, test, type Page } from "@playwright/test";

// Q0.2 onward: the main clinic loop in a real browser. Fake data only.
// Built up task by task (Q0.2 doctor visit, Q0.3 issue, Q0.5 bill and payments).
// Any 4xx/5xx answer from the API fails the test (C1, C3, C4 passed every unit test).

function watchApiFailures(page: Page): string[] {
  const bad: string[] = [];
  page.on("response", async (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) {
      bad.push(
        `${r.status()} ${r.request().method()} ${r.url()} ${(await r.text()).slice(0, 160)}`,
      );
    }
  });
  return bad;
}

test.describe("core loop (Q0.2+)", () => {
  test("receptionist registers, walk-in in chair; doctor writes the visit and finalises", async ({
    page,
  }) => {
    const bad = watchApiFailures(page);
    const stamp = Date.now().toString().slice(-6);
    const name = `Loop Test ${stamp}`;

    // ---- Receptionist: register, emergency walk-in (works after clinic hours), In chair ----
    await page.goto("/api/staff/auth/dev-login?role=receptionist");
    await page.goto("/app/patients/new");
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Or age (years)").fill("27");
    await page.getByLabel("Mobile", { exact: true }).fill(`9000${stamp}`);
    await page.getByRole("button", { name: "Save patient" }).click();
    await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();

    await page.goto("/app");
    await page.getByRole("button", { name: "Walk-in" }).last().click();
    const dialog = page.locator("dialog[open]");
    await dialog.getByLabel("Patient").fill(`Loop Test ${stamp}`);
    await dialog.locator("button.quick-book-result").first().click();
    await dialog.getByLabel("Visit type").selectOption({ label: "Consultation" });
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: /Add walk-in/ }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "In chair" }).last().click();

    // ---- Doctor: open visit, write, procedure, diagnosis, medicine, finalise ----
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    await page.goto("/app");
    await page
      .getByRole("link", { name: "Open visit" })
      .or(page.getByRole("button", { name: "Open visit" }))
      .last()
      .click();
    await page.getByLabel("Chief complaint").fill("Wants alignment check");
    await page.getByLabel("Exam").fill("Crowding lower anterior");
    await expect(page.getByText("Saved", { exact: true }).first()).toBeVisible();

    await page.getByRole("tab", { name: "Chart", exact: true }).click();
    await page
      .getByRole("button", { name: /^Tooth 36, permanent/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Add procedure" }).click();

    await page.getByRole("tab", { name: "Today's visit", exact: true }).click();
    await page.getByPlaceholder(/Type to search or enter free text/).fill("Crowding");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await page.getByRole("tab", { name: "Medicines", exact: true }).click();
    await page.getByPlaceholder(/Search medicine/).fill("Amox");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Finalise visit" }).click();
    await dialog.getByRole("button", { name: "Finalise" }).click();
    await expect(page.getByRole("button", { name: "Create bill" })).toBeVisible();

    expect(bad, bad.join("\n")).toEqual([]);
  });
});
