import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Part T (T2.12): the doctor's Today page in a real browser. Fake data only. Walk-ins are
// emergencies so the spec works at any time of day (they may overbook the chair).
const VISIT_TYPE = "01M83VTYPE01CONSULT000001";
const ORIGIN = "http://localhost:8787";
const HEADERS = { origin: ORIGIN, "x-clinic-request": "1", "content-type": "application/json" };

async function call(
  ctx: APIRequestContext,
  method: "GET" | "POST" | "PATCH",
  path: string,
  data?: unknown,
) {
  const res = await ctx.fetch(`/api/staff${path}`, {
    method,
    headers: HEADERS,
    ...(data ? { data } : {}),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
  return { status: res.status(), data: body.data ?? {} };
}

async function seed(desk: APIRequestContext, names: string[]) {
  const stamp = Date.now().toString().slice(-5);
  const ids: string[] = [];
  for (const [i, name] of names.entries()) {
    const patient = await call(desk, "POST", "/patients", {
      fullName: `${name} ${stamp}`,
      gender: "female",
      ageYearsAtReg: 30,
      mobile: `9${i}0${stamp}9`.slice(0, 10).padEnd(10, "1"),
    });
    expect(patient.status).toBe(201);
    const w = await call(desk, "POST", "/appointments/walk-in", {
      patientId: patient.data.patient.id,
      visitTypeId: VISIT_TYPE,
      priority: "emergency",
    });
    expect(w.status).toBe(201);
    ids.push(w.data.appointment.id);
  }
  return { stamp, ids };
}

async function signedInAs(playwright: typeof import("@playwright/test"), role: string) {
  const ctx = await playwright.request.newContext({ baseURL: ORIGIN });
  expect((await ctx.get(`/api/staff/auth/dev-login?role=${role}`)).ok()).toBe(true);
  return ctx;
}

const rowOf = (page: Page, name: string) => page.locator("li.td-row", { hasText: name });
async function openMenu(page: Page, name: string, item: string) {
  await rowOf(page, name)
    .getByRole("button", { name: /More actions/ })
    .click();
  await page.getByRole("menuitem", { name: item }).click();
}

test("doctor Today: header, order, Skip, Pull forward, Late, break, Waiting for you, search", async ({
  browser,
  playwright,
}) => {
  test.setTimeout(150_000);
  const desk = await signedInAs(playwright, "receptionist");
  const { stamp, ids } = await seed(desk, ["Asha Test", "Bina Test", "Chitra Test", "Divya Test"]);
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 650 } });
  const page = await ctx.newPage();
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 500) bad.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app");

  // Header, counts and the empty chair
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".td-counts")).toContainText("waiting");
  await expect(page.getByRole("region", { name: "Current patient in chair" })).toContainText(
    "No one in the chair",
  );
  await expect(page.locator("li.td-row")).toHaveCount(4);
  // Only one search box on the page
  await expect(page.getByLabel("Search patient by name, mobile, or patient number")).toBeVisible();
  await page.screenshot({ path: "test-results/doctor-today-1366.png" });

  // Skip the first row: the second moves up and becomes Next, the order survives a reload
  const names = async () =>
    (await page.locator("li.td-row .td-name").allTextContents()).map((n) => n.split(" ")[0]);
  const before = await names();
  await openMenu(page, `Asha Test ${stamp}`, "Skip (stepped out)");
  await page.getByRole("alertdialog").getByRole("button", { name: "Skip", exact: true }).click();
  await expect.poll(names).not.toEqual(before);
  await expect(rowOf(page, `Asha Test ${stamp}`)).toContainText("Stepped out");
  await page.reload();
  expect(await names()).not.toEqual(before);
  await expect(rowOf(page, `Asha Test ${stamp}`)).toContainText("Stepped out");
  await expect(page.locator(".td-note")).toContainText("Order updated");

  // Pull forward the last row one slot up
  const last = (await names()).at(-1) as string;
  const orderBefore = await names();
  await openMenu(page, last, "Pull forward (see next)");
  await page.getByRole("alertdialog").getByRole("button", { name: "Pull forward" }).click();
  await expect.poll(names).not.toEqual(orderBefore);

  // Late: coming today moves the row to the back
  const first = (await names())[0] as string;
  await openMenu(page, first, "Late arrived");
  await page.getByRole("button", { name: "Coming today (move back in queue)" }).click();
  await expect.poll(async () => (await names()).at(-1)).toBe(first);

  // Start puts the patient in the chair; then a break is refused, Done frees the chair
  await rowOf(page, "Chitra").getByRole("button", { name: "Start" }).click();
  const confirm = page.getByRole("alertdialog");
  if (await confirm.isVisible().catch(() => false))
    await confirm.getByRole("button", { name: "Start visit" }).click();
  await expect(page.getByRole("region", { name: "Current patient in chair" })).toContainText(
    "Chitra",
    { timeout: 10_000 },
  );
  await expect(page.getByRole("button", { name: /Take a break/ })).toBeDisabled();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("region", { name: "Current patient in chair" })).toContainText(
    "No one in the chair",
  );

  // Break: start 10 min, +5, -5, reload keeps it, I'm back
  await page.getByRole("button", { name: /Take a break/ }).click();
  await page.getByRole("menuitem", { name: /10 min/ }).click();
  await expect(page.locator(".td-break.is-active")).toBeVisible();
  await expect(page.locator(".td-pill", { hasText: "On break" })).toBeVisible();
  await page.getByRole("button", { name: "+5 min" }).click();
  await expect(page.locator(".td-break")).toContainText("15 min");
  await page.getByRole("button", { name: "-5 min" }).click();
  await expect(page.locator(".td-break")).toContainText("10 min");
  await page.reload();
  await expect(page.locator(".td-break.is-active")).toBeVisible();
  // Start during the break warns first
  await rowOf(page, "Bina").getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Doctor is on break");
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "I'm back" }).click();
  await expect(page.locator(".td-break.is-active")).toHaveCount(0);

  // Waiting for you: the desk asks, the doctor says Yes with a note, the desk sees the answer
  const ask = await call(desk, "POST", "/approvals", {
    type: "emergency_insert",
    appointmentId: ids[1],
    note: "Pain, wants 3 PM",
    urgent: true,
  });
  expect(ask.status).toBe(201);
  await page.reload();
  const panel = page.getByRole("complementary", { name: "Waiting for you" });
  await expect(panel).toContainText("Urgent request");
  await panel.getByRole("button", { name: "Note" }).first().click();
  await panel
    .getByLabel(/^Note for/)
    .first()
    .fill("Yes, come at 3");
  await panel.getByRole("button", { name: "Yes", exact: true }).first().click();
  await expect(panel).not.toContainText("Urgent request", { timeout: 5_000 });
  const mine = await call(desk, "GET", "/approvals");
  expect((mine.data.approvals as Array<Record<string, unknown>>)[0]).toMatchObject({
    status: "approved",
    answerNote: "Yes, come at 3",
  });

  // Minimize and restore the panel
  await panel.getByRole("button", { name: "Minimize Waiting for you" }).click();
  await expect(page.getByRole("button", { name: /^Waiting for you/ })).toBeVisible();
  await page.getByRole("button", { name: /^Waiting for you/ }).click();
  await expect(panel).toBeVisible();

  // Search filters the list; clearing brings it back
  const search = page.getByLabel("Search patient by name, mobile, or patient number");
  await search.fill("Divya");
  await expect(page.locator("li.td-row:not(.is-search-hidden)")).toHaveCount(1);
  await search.fill("");
  await expect(page.locator("li.td-row:not(.is-search-hidden)")).toHaveCount(4);

  expect(bad).toEqual([]);
  await ctx.close();
  await desk.dispose();
});
