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

// The scratch database is shared by every spec: start from a free chair and no break.
async function clearDay(doc: APIRequestContext) {
  const cur = await call(doc, "GET", "/breaks/current");
  const b = cur.data.current as { id: string; version: number } | null;
  if (b) await call(doc, "POST", `/breaks/${b.id}/end`, { version: b.version });
  const day = await call(doc, "GET", "/appointments");
  for (const a of (day.data.appointments ?? []) as Array<{
    id: string;
    status: string;
    version: number;
  }>) {
    if (a.status === "in_chair")
      await call(doc, "PATCH", `/appointments/${a.id}/status`, {
        status: "completed",
        version: a.version,
      });
  }

  for (const a of (day.data.appointments ?? []) as Array<{
    id: string;
    status: string;
    version: number;
  }>) {
    if (["scheduled", "confirmed", "arrived"].includes(a.status)) {
      await call(doc, "POST", `/appointments/${a.id}/cancel`, {
        version: a.version,
        reason: "patient_request",
      });
    }
  }
}

async function seed(desk: APIRequestContext, names: string[]) {
  await clearDay(desk);
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
  await clearDay(await signedInAs(playwright, "doctor"));
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
    /The chair is free/,
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
    /The chair is free/,
  );

  // Break: start 10 min, +5, -5, reload keeps it, I'm back
  await page.getByRole("button", { name: /Take a break/ }).click();
  await page.getByRole("menuitem", { name: /10 min/ }).click();
  // Optimistic: the banner opens at once, not after the server answers.
  await expect(page.locator(".td-break.is-active")).toBeVisible({ timeout: 900 });
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

// T2.9: phone and tablet. No sideways scroll, tap targets of 44 px, the same screen in one column.
for (const [width, height, label] of [
  [360, 740, "360"],
  [768, 1024, "768"],
  [1366, 650, "1366"],
] as const) {
  test(`doctor Today at ${label} px: no sideways scroll, big tap targets`, async ({
    browser,
    playwright,
  }) => {
    test.setTimeout(90_000);
    const desk = await signedInAs(playwright, "receptionist");
    const { stamp } = await seed(desk, ["Esha Test", "Farah Test"]);
    const touch = width < 1024;
    const ctx = await browser.newContext({
      viewport: { width, height },
      hasTouch: touch,
      isMobile: touch,
    });
    const page = await ctx.newPage();
    await page.goto("/api/staff/auth/dev-login?role=doctor");
    await page.goto("/app");
    await expect(rowOf(page, `Esha Test ${stamp}`)).toBeVisible();
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways).toBeLessThanOrEqual(1);
    if (touch) {
      for (const sel of [
        ".td-action",
        ".td-more",
        ".td-row-main",
        ".td-break-btn",
        ".td-search-input",
      ]) {
        const box = await page.locator(sel).first().boundingBox();
        expect(box?.height ?? 0, `${sel} height at ${label}`).toBeGreaterThanOrEqual(43.5);
      }
    }
    await page.screenshot({
      path: `docs/ui-audit/screenshots/redesign/T2/DoctorToday-${label}.png`,
      fullPage: true,
    });
    await ctx.close();
    await desk.dispose();
  });
}

// T2.8: the desk asks the doctor from Today; the doctor answers; the desk sees it. Skip by the desk
// shows on the doctor's list as "Order updated by <name>".
test("desk: Ask the doctor, the answer, and Skip shows on the doctor's list", async ({
  browser,
  playwright,
}) => {
  test.setTimeout(120_000);
  const deskApi = await signedInAs(playwright, "receptionist");
  const docApi = await signedInAs(playwright, "doctor");
  const { stamp, ids } = await seed(deskApi, ["Gita Test", "Hema Test"]);
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app");
  const row = page.locator("li.today-row", { hasText: `Gita Test ${stamp}` });
  await row.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Ask the doctor..." }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Note for the doctor").fill("Pain, wants 3 PM");
  await dialog.getByRole("button", { name: "Send to the doctor" }).click();
  const strip = page.getByRole("region", { name: "Asked the doctor" });
  await expect(strip).toContainText("Waiting for the doctor");

  // The doctor says yes through the API; the desk sees the answer and presses Got it.
  const list = await call(docApi, "GET", "/approvals");
  const mine = (
    list.data.approvals as Array<{ id: string; version: number; appointmentId: string }>
  ).find((a) => a.appointmentId === ids[0])!;
  const answer = await call(docApi, "POST", `/approvals/${mine.id}/answer`, {
    decision: "approve",
    note: "Yes",
    version: mine.version,
  });
  expect(answer.status).toBe(200);
  await page.reload();
  await expect(strip).toContainText("Doctor said yes");
  await strip.locator("li", { hasText: stamp }).getByRole("button", { name: "Got it" }).click();
  await expect(
    page.getByRole("region", { name: "Asked the doctor" }).locator("li", { hasText: stamp }),
  ).toHaveCount(0);

  // Skip by the desk
  await row.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Skip" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Skip" }).click();
  await expect(page.locator(".toast-text", { hasText: "Skipped" })).toBeVisible();

  const doc = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const docPage = await doc.newPage();
  await docPage.goto("/api/staff/auth/dev-login?role=doctor");
  await docPage.goto("/app");
  await expect(docPage.locator(".td-note")).toContainText(/Order updated by .+ at /);
  await ctx.close();
  await doc.close();
  await deskApi.dispose();
  await docApi.dispose();
});

// T2.10: keyboard only. The row menu opens with Enter, arrows move, Esc closes and focus returns;
// the Skip confirm closes with Esc; the break menu works from the keyboard.
test("doctor Today: keyboard only", async ({ browser, playwright }) => {
  test.setTimeout(90_000);
  await clearDay(await signedInAs(playwright, "doctor"));
  const desk = await signedInAs(playwright, "receptionist");
  const { stamp } = await seed(desk, ["Indu Test", "Jaya Test"]);
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 700 } });
  const page = await ctx.newPage();
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app");
  const more = rowOf(page, `Indu Test ${stamp}`).getByRole("button", { name: /More actions/ });
  await more.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu", { name: /Actions for/ });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();

  // Skip from the keyboard: Enter on the item, then Esc on the confirm leaves the order alone.
  const before = await page.locator("li.td-row .td-name").allTextContents();
  await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: "Skip (stepped out)" }).focus();
  await page.keyboard.press("Enter");
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(confirm).toBeHidden();
  expect(await page.locator("li.td-row .td-name").allTextContents()).toEqual(before);

  // The break menu from the keyboard
  const breakButton = page.getByRole("button", { name: /Take a break/ });
  await breakButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu", { name: "Take a break" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(breakButton).toBeFocused();

  // The list rows have a readable name: name, time, status, next
  await expect(rowOf(page, `Indu Test ${stamp}`).locator(".td-row-main")).toHaveAccessibleName(
    /Indu Test .*, \d{1,2}:\d{2} [AP]M, waiting.*/,
  );
  await ctx.close();
  await desk.dispose();
});

// Cancel is optimistic: the row is struck through at once and leaves the list; the server catches up.
test("doctor Today: Cancel strikes the row at once and it leaves the list", async ({
  browser,
  playwright,
}) => {
  test.setTimeout(90_000);
  const desk = await signedInAs(playwright, "receptionist");
  const { stamp } = await seed(desk, ["Kiran Test", "Lata Test"]);
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 700 } });
  const page = await ctx.newPage();
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app");
  await openMenu(page, `Kiran Test ${stamp}`, "Cancel appointment");
  await page
    .locator("dialog[open]")
    .getByRole("button", { name: /Cancel appointment|Confirm/ })
    .last()
    .click();
  await expect(rowOf(page, `Kiran Test ${stamp}`)).toHaveClass(/is-cancelled/, { timeout: 500 });
  await expect(rowOf(page, `Kiran Test ${stamp}`)).toHaveCount(0, { timeout: 4000 });
  await expect(rowOf(page, `Lata Test ${stamp}`)).toBeVisible();
  await ctx.close();
  await desk.dispose();
});
