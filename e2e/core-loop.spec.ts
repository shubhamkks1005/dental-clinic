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

test.describe("core loop (Q0.2 to Q0.5)", () => {
  test("receptionist registers, walk-in in chair; doctor visit, bill, two payments", async ({
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
    await page.getByRole("button", { name: /^Amoxicillin 500 mg/ }).click();
    await expect(page.getByRole("table")).toContainText("Amoxicillin");
    // Q0.3: Issue must not answer 409 (it used the stale version); reload still shows it issued.
    await page.getByRole("button", { name: "Issue", exact: true }).click();
    await expect(page.getByRole("link", { name: "Print" })).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: "Medicines", exact: true }).click();
    await expect(page.getByRole("link", { name: "Print" })).toBeVisible();
    await page.getByRole("link", { name: "Print" }).click();
    await expect(page).toHaveURL(/\/app\/print\/prescription\//);
    await page.goBack();

    await page.getByRole("button", { name: "Finalise visit" }).click();
    await dialog.getByRole("button", { name: "Finalise" }).click();
    await page.getByRole("button", { name: "Create bill" }).click();
    await page.getByRole("button", { name: "Issue bill" }).click();
    await expect(page.getByRole("button", { name: "Issue bill" })).toBeHidden();

    // ---- Receptionist: part payment, then the rest; the statement shows both ----
    await page.goto("/api/staff/auth/dev-login?role=receptionist");
    await page.goto("/app");
    // Q1.2: the finalised, unpaid visit shows Take payment on Today and in the stat strip.
    const row = page.locator("li.today-row", { hasText: name });
    await expect(row.getByRole("link", { name: "Take payment" })).toBeVisible();
    await expect(page.locator(".stat", { hasText: "Ready to bill" })).toContainText("visit done");
    await row.getByRole("link", { name: "Take payment" }).click();
    await expect(page).toHaveURL(/\/app\/bills\//);
    await expect(page.getByRole("button", { name: "Record payment" })).toBeVisible();
    await page.goto("/app");
    await page.getByRole("combobox").first().fill(name);
    await page.waitForTimeout(1000);
    await page.keyboard.press("Enter");
    await page.getByRole("tab", { name: "Billing", exact: true }).click();
    const patientId = page.url().split("/").pop()?.split("?")[0] ?? "";
    await page.getByLabel(/Amount/).fill("500");
    await page.getByRole("button", { name: "Record payment" }).click();
    await expect(page.getByText(/500/).first()).toBeVisible();
    await expect(page.getByText("Due ₹1,000")).toBeVisible();
    // Q1.3: a toast with the receipt number and Print, and a Payments row with its receipt link.
    await expect(page.locator(".toast-text", { hasText: /₹500 recorded\. Receipt/ })).toBeVisible();
    await expect(page.locator(".toast-link")).toHaveAttribute("href", /\/app\/print\/receipt\//);
    const paymentRow = page.getByLabel("Payments", { exact: true }).locator("li").first();
    await expect(paymentRow).toContainText("Applied to");
    const [receiptPage] = await Promise.all([
      page.context().waitForEvent("page"),
      paymentRow.getByRole("link", { name: /Print receipt SR-/ }).click(),
    ]);
    await expect(receiptPage).toHaveURL(/\/app\/print\/receipt\//);
    await receiptPage.close();
    // Q0.6: an amount above the balance asks first; "Change amount" records nothing.
    await page.getByLabel(/Amount/).fill("20000");
    await page.getByRole("button", { name: "Record payment" }).click();
    await expect(page.getByText(/more than the balance/)).toBeVisible();
    await page.getByRole("button", { name: "Change amount" }).click();
    await expect(page.getByText(/more than the balance/)).toBeHidden();
    await page.getByLabel(/Amount/).fill("0");
    await expect(page.getByText("Enter an amount above 0.")).toBeVisible();
    // Q0.6: Full balance only fills the Amount field; Record payment takes the money.
    await page.getByRole("button", { name: "Full balance" }).click();
    await expect(page.getByLabel(/Amount/)).toHaveValue("1000");
    await page.getByRole("button", { name: "Record payment" }).click();
    await page.goto(`/app/print/statement/${patientId}`);
    const body = page.locator("body");
    await expect(body).toContainText("Outstanding: ₹0");
    await expect(body).toContainText("₹1,500");
    await expect(body).toContainText("₹500");
    await expect(body).toContainText("₹1,000");
    await expect(page.locator("tr", { hasText: "SR-" })).toHaveCount(2);

    expect(bad, bad.join("\n")).toEqual([]);
  });
});
