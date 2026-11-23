import { expect, test, type Page } from "@playwright/test";

// Q1.1: no dead end between Finalise and the bill. Procedures sit on the first visit tab, the
// Finalise dialog warns when there are none, and Create bill says why it is off. Fake data only.

async function walkInInChair(page: Page, name: string, stamp: string) {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Gender").selectOption("female");
  await page.getByLabel("Or age (years)").fill("31");
  await page.getByLabel("Mobile", { exact: true }).fill(`9001${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
  await page.goto("/app");
  await page.getByRole("button", { name: "Walk-in" }).last().click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Patient").fill(name);
  await dialog.locator("button.quick-book-result").first().click();
  await dialog.getByLabel("Visit type").selectOption({ label: "Consultation" });
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: /Add walk-in/ }).click();
  await expect(dialog).toBeHidden();
}

async function doctorOpensVisitOf(page: Page, name: string) {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app");
  await page
    .locator("li.today-row, li.doctor-row", { hasText: name })
    .getByRole("link", { name: "Open visit" })
    .or(page.locator("li", { hasText: name }).getByRole("button", { name: "Open visit" }))
    .first()
    .click();
  await expect(page.getByLabel("Chief complaint")).toBeVisible();
}

test("finalise with no procedure warns and Create bill says why it is off; with a procedure it works", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const a = `Chain NoProc ${stamp}`;
  const b = `Chain WithProc ${stamp}`;
  await walkInInChair(page, a, stamp);
  await walkInInChair(page, b, String(Number(stamp) + 1).padStart(6, "0"));

  // ---- Visit A: no procedure ----
  await doctorOpensVisitOf(page, a);
  await page.getByLabel("Chief complaint").fill("Fake: check-up");
  await expect(page.getByText("Saved", { exact: true }).first()).toBeVisible();
  // Q1.10: on a phone the chart scrolls inside its own card and the tooth buttons are finger-sized.
  await page.setViewportSize({ width: 360, height: 780 });
  await page.getByRole("tab", { name: "Chart", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const whole = await page.locator("button.tooth-whole").first().boundingBox();
  expect(whole && whole.width >= 44 && whole.height >= 44).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("tab", { name: "Today's visit", exact: true }).click();
  await page.getByRole("button", { name: "Finalise visit" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("No procedures are recorded");
  await expect(dialog).toContainText("but not a procedure");
  await dialog.getByRole("button", { name: "Finalise", exact: true }).click();
  await expect(page.getByRole("button", { name: "Create bill" })).toBeDisabled();
  await expect(page.getByText(/No procedures were recorded on this visit/)).toBeVisible();

  // ---- Visit B: procedure added on the FIRST tab, then the bill works ----
  await doctorOpensVisitOf(page, b);
  await page.getByLabel("Chief complaint").fill("Fake: scaling");
  await expect(page.getByText("Saved", { exact: true }).first()).toBeVisible();
  const procedures = page.getByRole("region", { name: "Procedures" });
  await procedures.getByLabel("Procedure").selectOption({ index: 1 });
  await procedures.getByRole("button", { name: "Add procedure" }).click();
  await expect(procedures.locator("li")).toHaveCount(1);
  await page.getByRole("button", { name: "Finalise visit" }).click();
  await expect(dialog).not.toContainText("No procedures are recorded");
  await dialog.getByRole("button", { name: "Finalise", exact: true }).click();
  await page.getByRole("button", { name: "Create bill" }).click();
  await expect(page).toHaveURL(/\/app\/bills\//);

  expect(bad, bad.join("\n")).toEqual([]);
});

// Q1.7: the desk asks for a discount, the doctor sees it under "Waiting for you" and approves it.
test("discount request leaves the total alone until the doctor approves", async ({ page }) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const name = `Disc Test ${stamp}`;
  await walkInInChair(page, name, stamp);
  await doctorOpensVisitOf(page, name);
  const procedures = page.getByRole("region", { name: "Procedures" });
  await procedures.getByLabel("Procedure").selectOption({ index: 1 });
  await procedures.getByRole("button", { name: "Add procedure" }).click();
  await expect(procedures.locator("li")).toHaveCount(1);
  await page.getByRole("button", { name: "Finalise visit" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Finalise", exact: true }).click();
  await page.getByRole("button", { name: "Review first" }).click();
  await expect(page).toHaveURL(/\/app\/bills\//);
  const billPath = new URL(page.url()).pathname;
  const totalText = async () =>
    (
      await page
        .locator(".bill-screen")
        .getByText("Total", { exact: true })
        .locator("xpath=..")
        .innerText()
    ).replace(/\s+/g, " ");
  const before = await totalText();

  // Receptionist asks for a discount: the total stays, Issue says why it is off.
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto(billPath);
  await page
    .getByLabel(/Amount/)
    .last()
    .fill("100");
  await page.getByRole("button", { name: "Request discount" }).click();
  await expect(page.getByText(/Requested ₹100/)).toBeVisible();
  await expect(page.getByText("Waiting for the doctor to approve the discount.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Issue bill" })).toBeDisabled();
  expect(await totalText()).toBe(before);

  // Doctor: Waiting for you -> Approve; now the total is lower and Issue works.
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app");
  const waiting = page.getByRole("region", { name: "Waiting for you" });
  await expect(waiting).toContainText(`Discount for ${name}`);
  await waiting.locator("li", { hasText: name }).getByRole("button", { name: "Approve" }).click();
  await expect(waiting.locator("li", { hasText: name })).toHaveCount(0);
  await page.goto(billPath);
  expect(await totalText()).not.toBe(before);
  await page.getByRole("button", { name: "Issue bill" }).click();
  await expect(
    page
      .getByRole("button", { name: "Print bill" })
      .or(page.getByRole("link", { name: "Print bill" })),
  ).toBeVisible();

  expect(bad, bad.join("\n")).toEqual([]);
});

// Q1.9: the wrong-bill path. The desk asks, the doctor sees it, "Refund first" appears when paid.
test("receptionist asks the doctor to cancel a bill; doctor is told to refund first", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const name = `Wrong Bill ${stamp}`;
  await walkInInChair(page, name, stamp);
  await doctorOpensVisitOf(page, name);
  const procedures = page.getByRole("region", { name: "Procedures" });
  await procedures.getByLabel("Procedure").selectOption({ index: 1 });
  await procedures.getByRole("button", { name: "Add procedure" }).click();
  await expect(procedures.locator("li")).toHaveCount(1);
  await page.getByRole("button", { name: "Finalise visit" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Finalise", exact: true }).click();
  await page.getByRole("button", { name: "Create bill" }).click();
  await expect(page).toHaveURL(/\/app\/bills\//);
  const billPath = new URL(page.url()).pathname;
  await expect(page.getByRole("button", { name: "Record payment" })).toBeVisible();

  // Receptionist takes a part payment, then asks the doctor to cancel the bill.
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto(billPath);
  await page
    .getByLabel(/Amount/)
    .first()
    .fill("100");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.locator(".toast-text", { hasText: /recorded/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel bill" })).toHaveCount(0);
  await page.getByText("More actions").click();
  await page.getByRole("button", { name: "Ask the doctor to cancel" }).click();
  await page.getByLabel("Why is it wrong?").fill("Fake: wrong procedure");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/You asked the doctor to cancel this bill/)).toBeVisible();

  // Doctor: Waiting for you, then the cancel panel says to refund first.
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app");
  const waiting = page.getByRole("region", { name: "Waiting for you" });
  await expect(waiting).toContainText(`Cancel bill`);
  await expect(waiting).toContainText(name);
  await waiting.locator("li", { hasText: name }).getByRole("link", { name: "Open bill" }).click();
  await page.getByText("More actions").click();
  await expect(page.getByText(/Reception asks to cancel this bill/)).toBeVisible();
  await page.getByRole("button", { name: "Cancel bill" }).click();
  await expect(page.getByRole("link", { name: "Refund first" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm cancel" })).toBeDisabled();

  expect(bad, bad.join("\n")).toEqual([]);
});
