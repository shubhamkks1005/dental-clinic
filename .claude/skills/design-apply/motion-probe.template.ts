// Template for the motion probe. Copy to e2e/tmp-motion-<name>.spec.ts, fill the TODOs, run with
//   LAT=300 pnpm exec playwright test e2e/tmp-motion-<name>.spec.ts
// Never commit the tmp copy. Fake data only. Read design-apply/lessons.md first.
import { test, type Page } from "@playwright/test";

const ORIGIN = "http://localhost:8787";
const H = { origin: ORIGIN, "x-clinic-request": "1", "content-type": "application/json" };
const LATENCY = Number(process.env.LAT ?? 300);

// TODO: selectors of every element the design animates (from handoff section 3).
const SELS = [".example-card", ".example-row", ".example-menu", "dialog[open]"];

type V = [number, number, number, number, string, string, number]; // top, height, opacity, width, transform, bg, left
type Frame = { t: number; y: number; v: Record<string, V> };

async function startSampler(page: Page) {
  await page.evaluate((sels) => {
    const w = window as unknown as { __f: unknown[]; __run: boolean; __t0: number; __mark: number };
    w.__f = [];
    w.__run = true;
    w.__t0 = performance.now();
    w.__mark = -1;
    const tick = () => {
      if (!w.__run) return;
      const v: Record<string, unknown> = {};
      for (const s of sels) {
        document.querySelectorAll(s).forEach((el, i) => {
          if (i > 7) return;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          v[`${s}#${i}`] = [
            Math.round(r.top * 10) / 10,
            Math.round(r.height * 10) / 10,
            Number(cs.opacity),
            Math.round(r.width * 10) / 10,
            cs.transform,
            cs.backgroundColor,
            Math.round(r.left * 10) / 10,
          ];
        });
      }
      w.__f.push({ t: performance.now() - w.__t0, y: window.scrollY, v });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, SELS);
}
const mark = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __mark: number; __t0: number };
    w.__mark = performance.now() - w.__t0;
  });
const stop = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __f: unknown[]; __run: boolean; __mark: number };
    w.__run = false;
    return { frames: w.__f as Frame[], mark: w.__mark };
  });

function report(name: string, frames: Frame[], clickAt: number) {
  const best = new Map<string, { score: number; line: string }>();
  const keys = new Set<string>();
  frames.forEach((f) => Object.keys(f.v).forEach((k) => keys.add(k)));
  for (const k of keys) {
    const sel = k.split("#")[0]!;
    let prev: V | undefined;
    let first = -1, last = -1, changes = 0, maxJump = 0, anim = false;
    for (const f of frames) {
      const a = f.v[k];
      if (!a) continue;
      if (prev && f.t >= clickAt) {
        const dPos = Math.abs(a[0] - prev[0]) + Math.abs(a[1] - prev[1]) + Math.abs(a[6] - prev[6]);
        const dW = Math.abs(a[3] - prev[3]);
        const dOp = Math.abs(a[2] - prev[2]) * 100;
        const dStyle = a[4] !== prev[4] || a[5] !== prev[5];
        if (dPos > 0.6 || dW > 0.6 || dOp > 0.6 || dStyle) {
          changes++;
          if (first < 0) first = f.t;
          last = f.t;
          maxJump = Math.max(maxJump, dPos, dW);
          if (dStyle) anim = true;
        }
      }
      prev = a;
    }
    if (changes === 0) continue;
    const lat = Math.round(first - clickAt);
    const dur = Math.round(last - first);
    const flags = [lat > 100 ? "SLOW START" : "", changes <= 3 && maxJump > 24 ? "SNAP" : ""]
      .filter(Boolean)
      .join(", ");
    const line = `   ${sel.padEnd(15)} start +${String(lat).padStart(4)}ms  lasts ${String(dur).padStart(4)}ms  ${String(changes).padStart(2)} frames  max step ${String(Math.round(maxJump)).padStart(3)}px${anim ? "  (scale/colour)" : ""}${flags ? "   <-- " + flags : ""}`;
    const score = dur + (flags ? 10000 : 0);
    if (!best.has(sel) || best.get(sel)!.score < score) best.set(sel, { score, line });
  }
  const ys = new Set(frames.map((f) => Math.round(f.y)));
  console.log(
    `\n== ${name}\n${[...best.values()].map((b) => b.line).join("\n") || "   (nothing moved)"}${ys.size > 1 ? `\n   PAGE SCROLL MOVED: ${[...ys].join(" -> ")}` : ""}`,
  );
}

/** Runs one scenario. Call `m()` right before the FINAL click so the delay is measured from it. */
async function scenario(
  page: Page,
  name: string,
  act: (m: () => Promise<void>) => Promise<void>,
  wait = 1500,
) {
  await startSampler(page);
  await page.waitForTimeout(150);
  await act(() => mark(page));
  await page.waitForTimeout(wait);
  const { frames, mark: m } = await stop(page);
  report(name, frames, m);
}

test("motion probe", async ({ browser, playwright }) => {
  test.setTimeout(420_000);

  // 1. Seed through the API (fake data). Clear leftovers first: the scratch DB is shared.
  const desk = await playwright.request.newContext({ baseURL: ORIGIN });
  await desk.get("/api/staff/auth/dev-login?role=receptionist");
  void H; // TODO: clear the day, create patients/appointments/requests so EVERY state in the handoff exists.

  // 2. Open the page as the right role, then slow the server down like staging.
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 700 } }); // also run 768x1024 and 360x740
  const page = await ctx.newPage();
  await page.goto("/api/staff/auth/dev-login?role=doctor"); // TODO role
  await page.goto("/app"); // TODO route
  await page.waitForTimeout(800);
  await page.route("**/api/**", async (route) => {
    await new Promise((r) => setTimeout(r, LATENCY));
    await route.continue();
  });
  console.log(`\n#### API delayed by ${LATENCY} ms. HTML timings: TODO list them from the handoff.`);

  // 3. One scenario per test case of the handoff (section 10). Repeat each interaction 3-5 times.
  await scenario(page, "example: open the menu", async (m) => {
    await m();
    await page.getByRole("button", { name: /Example/ }).click(); // TODO
  });

  // 4. Refusing server: make the API answer 409 and check the screen goes back (screenshot + assert).
  // await page.route("**/api/staff/<route>", (route) => route.fulfill({ status: 409, json: { ok: false, error: { code: "conflict", message: "..." } } }));

  await ctx.close();
});
