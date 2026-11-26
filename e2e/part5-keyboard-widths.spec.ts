import { expect, test, type Page } from "@playwright/test";

// Part 5 cleanup 5: for every screen changed in Part 5, (a) a real keyboard-only pass (Tab with a
// visible focus ring, Enter and Esc), (b) dialog focus (goes in, Esc closes, returns to the
// opener) and (c) 360, 768 and 1366 px: no sideways scroll and targets at least 44 px.
// Fake data only.

const SCREENS: { name: string; role: "doctor" | "receptionist"; path: string }[] = [
  { name: "Calendar", role: "receptionist", path: "/app/appointments?view=day" },
  { name: "Messages", role: "receptionist", path: "/app/messages" },
  { name: "New patient", role: "receptionist", path: "/app/patients/new" },
  { name: "More", role: "receptionist", path: "/app/more" },
  { name: "Reports", role: "doctor", path: "/app/reports" },
  { name: "Settings", role: "doctor", path: "/app/settings" },
  { name: "Clinic and doctor", role: "doctor", path: "/app/settings/clinic" },
  { name: "Library", role: "doctor", path: "/app/library/medicines" },
];

async function login(page: Page, role: string, path: string) {
  await page.goto(`/api/staff/auth/dev-login?role=${role}`);
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/** Presses Tab `count` times; returns each stop with whether it shows a visible focus ring. */
async function tabStops(page: Page, count: number) {
  const stops: { label: string; ring: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press("Tab");
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return { label: "(none)", ring: true };
        // The parts inside a native date, month or time box are drawn by the browser.
        if (el instanceof HTMLInputElement && ["date", "month", "time"].includes(el.type))
          return { label: "(native date box)", ring: true };
        const cs = getComputedStyle(el);
        // Radios and checkboxes are drawn by their label (a pill): the ring is on the label.
        const label = el.closest("label");
        const lcs = label ? getComputedStyle(label) : null;
        const seen = (c: CSSStyleDeclaration | null) =>
          !!c &&
          ((c.outlineStyle !== "none" && parseFloat(c.outlineWidth) > 0) ||
            (c.boxShadow !== "none" && c.boxShadow !== ""));
        const lring = label ? label.matches(":focus-within") && seen(lcs) : false;
        return {
          label: `${el.tagName.toLowerCase()} ${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}`,
          ring: seen(cs) || lring,
        };
      }),
    );
  }
  return stops;
}

for (const s of SCREENS) {
  test(`keyboard only: ${s.name} (Tab reaches controls, each shows a focus ring)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await login(page, s.role, s.path);
    const stops = await tabStops(page, 25);
    const real = stops.filter((x) => x.label !== "(none)");
    expect(real.length, `${s.name}: Tab stops`).toBeGreaterThan(8);
    const noRing = real.filter((x) => !x.ring).map((x) => x.label);
    expect(noRing, `${s.name}: focus without a visible ring`).toEqual([]);
  });
}

test("keyboard only: New patient can be filled and saved without a mouse", async ({ page }) => {
  await login(page, "receptionist", "/app/patients/new");
  const stamp = Date.now().toString().slice(-6);
  await page.getByLabel("Full name").focus();
  await page.keyboard.type(`Kbd Patient ${stamp}`);
  await page.getByLabel("Female", { exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Female", { exact: true })).toBeChecked();
  await page.getByLabel("Or age (years)").focus();
  await page.keyboard.type("33");
  await page.getByLabel("Mobile", { exact: true }).focus();
  await page.keyboard.type(`9009${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
});

test("keyboard only: Reports charts fold opens with Enter; Settings item opens with Enter", async ({
  page,
}) => {
  await login(page, "doctor", "/app/reports");
  const summary = page.locator("summary").first();
  await summary.focus();
  const before = await page
    .locator("details")
    .first()
    .evaluate((d) => (d as HTMLDetailsElement).open);
  await page.keyboard.press("Enter");
  const after = await page
    .locator("details")
    .first()
    .evaluate((d) => (d as HTMLDetailsElement).open);
  expect(after).toBe(!before);

  await page.goto("/app/settings");
  await page
    .getByRole("link", { name: /Timings and holidays/ })
    .first()
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/settings\/timings/);
});

test("dialog focus: the booking popover takes focus, Esc closes it, focus returns", async ({
  page,
}) => {
  await login(page, "receptionist", "/app/appointments?view=day");
  const opener = page.getByRole("button", { name: "Book Appointment" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const pop = page.getByRole("dialog", { name: "Schedule Appointment" });
  await expect(pop).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => !!document.activeElement?.closest(".bk-pop")))
    .toBe(true);
  // Tab stays inside the popover.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest(".bk-pop"))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(pop).toBeHidden();
  await expect(opener).toBeFocused();
});

test("dialog focus: Walk-in dialog on Today, and the Library drawer", async ({ page }) => {
  await login(page, "receptionist", "/app");
  const walk = page.getByRole("button", { name: "Walk-in" }).last();
  await walk.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("dialog[open]")).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog[open]"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(walk).toBeFocused();

  await login(page, "doctor", "/app/library/medicines");
  const add = page.getByRole("button", { name: "Add medicine" });
  await add.focus();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog[open]"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(add).toBeFocused();
});

for (const s of SCREENS) {
  test(`widths: ${s.name} at 360, 768 and 1366 (no sideways scroll, targets 44 px)`, async ({
    page,
  }) => {
    await page.goto(`/api/staff/auth/dev-login?role=${s.role}`);
    for (const [w, h] of [
      [360, 780],
      [768, 1024],
      [1366, 768],
    ] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(s.path);
      await page.waitForLoadState("networkidle");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${s.name}: sideways scroll at ${w}`,
      ).toBeLessThanOrEqual(w);
      const small = await page.evaluate(() => {
        const out: string[] = [];
        const sel =
          'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="tab"]';
        for (const el of document.querySelectorAll<HTMLElement>(sel)) {
          if (el.closest("details:not([open])") && el.tagName !== "SUMMARY") continue;
          if (el.closest("dialog:not([open])")) continue;
          // Laptop calendar grid: a 15 minute cell is 21 px high by design (mouse and keyboard
          // only; hidden below 1024 px where the Book button is the way in).
          if (el.classList.contains("day-empty")) continue;
          // Final calendar design (appointments_calendar.html): a card's height is its length
          // (15 min = 22 px), so it is exempt like the old slot cells; it also opens from the list.
          if (el.closest(".cal-card, .cal-more")) continue;
          // Laptop only: the final HTML's 38 px header controls and compact chips (phone and
          // tablet get 44 px, cal-filter.css).
          if (innerWidth >= 1024 && el.closest(".cal-head")) continue;
          const isBox = el instanceof HTMLInputElement && ["radio", "checkbox"].includes(el.type);
          const target = isBox ? (el.closest("label") ?? el) : el;
          const r = target.getBoundingClientRect();
          const cs = getComputedStyle(target);
          if (r.width === 0 || r.height === 0 || cs.visibility === "hidden") continue;
          if (r.bottom < 0 || r.right < 0) continue;
          if (el.classList.contains("visually-hidden") || el.closest(".visually-hidden")) continue;
          // Links inside running text are exempt (WCAG inline exception).
          if (el.tagName === "A" && cs.display === "inline") continue;
          if (r.height < 43.5 || r.width < 43.5)
            out.push(
              `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
            );
        }
        return out;
      });
      expect(small, `${s.name}: targets under 44 px at ${w}`).toEqual([]);
    }
  });
}
