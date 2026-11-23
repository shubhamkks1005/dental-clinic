import { open, BASE, measure } from "./lib.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
const ROOT = process.env.FLOW_ROOT || "/Users/shubham.kumar/dental-clinic/docs/ui-audit/flows";
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export async function flow(spec, body) {
  const { id, role, vp = "laptop" } = spec;
  const dir = `${ROOT}/${id}`; mkdirSync(dir, { recursive: true });
  const { browser, page, issues } = await open(role, vp);
  const steps = []; let clicks = 0, typed = 0; const paths = new Set(); let lastFail = 0, lastCons = 0, n = 0;
  const visible = async () => page.evaluate(() => {
    const t = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null || e.closest("dialog[open]")).map((e) => e.innerText.trim()).filter(Boolean).slice(0, 4);
    return { h1: t("h1").join(" | "), alerts: t("[role=alert], .error, .field-error, .banner-error"), toasts: t("[role=status], .toast"), dialog: t("dialog[open]").map((x) => x.replace(/\n+/g, " | ").slice(0, 300)) };
  });
  const record = async (action, why, shotIt = true) => {
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(350);
    n++; const u = new URL(page.url()); paths.add(u.pathname);
    const st = { n, action, why, url: u.pathname + u.search, errors: [] };
    st.errors.push(...issues.failed.slice(lastFail)); lastFail = issues.failed.length;
    const c = issues.console.slice(lastCons).filter((x) => !x.includes("Failed to load resource")); st.errors.push(...c); lastCons = issues.console.length;
    st.visible = await visible();
    const sig = JSON.stringify([st.url, st.visible.h1, st.visible.dialog, st.visible.toasts, st.visible.alerts]);
    const changed = sig !== ctx._sig; ctx._sig = sig;
    if (shotIt && (changed || action === "look")) { st.shot = `${String(n).padStart(2, "0")}-${slug(why)}.jpg`; await page.screenshot({ path: `${dir}/${st.shot}`, type: "jpeg", quality: 55 }); }
    steps.push(st); return st;
  };
  const ctx = {
    _sig: "",
    page, issues, steps,
    async go(url, why) { await page.goto(BASE + url); return record("open " + url, why); },
    async click(loc, why, o = {}) { clicks++; await loc.first().click({ timeout: 8000, ...o }); return record("click", why); },
    async type(loc, val, why) { typed++; await loc.first().fill(val, { timeout: 8000 }); return record("type", why, false); },
    async pick(loc, val, why) { typed++; await loc.first().selectOption(val, { timeout: 8000 }); return record("select", why, false); },
    async key(k, why) { await page.keyboard.press(k); return record("key " + k, why); },
    async as(r, why) { await page.goto(`${BASE}/api/staff/auth/dev-login?role=${r}`); return record("switch user to " + r, why || ("Sign in as " + r)); },
    async m(why) { const r = await measure(page); const t = `MEASURE ${why}: horizontal scroll=${r.over ? "YES (" + r.scrollW + " > " + r.vw + ")" : "no"}; tap targets under 44px=${r.smallCount}${r.small.length ? " e.g. " + r.small.slice(0, 3).join(", ") : ""}`; steps.push({ n: ++n, action: "note", why: t, url: new URL(page.url()).pathname }); return r; },
    async look(why) { return record("look", why); },
    note(text) { steps.push({ n: ++n, action: "note", why: text, url: new URL(page.url()).pathname }); },
    async text() { return (await page.locator("main").innerText().catch(() => "")).replace(/\n+/g, " | "); },
    async safe(why, fn) { try { return await fn(); } catch (e) { steps.push({ n: ++n, action: "FAILED", why: why + " :: " + String(e.message).split("\n")[0], url: new URL(page.url()).pathname }); try { await record("state after failure", why); } catch {} return null; } },
  };
  let crashed = null;
  try { await body(ctx); } catch (e) { crashed = String(e.message).split("\n")[0]; }
  const result = { spec, metrics: { clicks, typedFields: typed, pagesVisited: [...paths], c1UnwrappedCalls: issues.unwrapped, failedRequests: issues.failed, stepCount: steps.length }, crashed, steps };
  writeFileSync(`${dir}/result.json`, JSON.stringify(result, null, 1));
  await browser.close();
  console.log(`[${id}] steps=${steps.length} clicks=${clicks} typed=${typed} pages=${paths.size} c1=${issues.unwrapped} failed=${issues.failed.length} ${crashed ? "CRASH " + crashed : ""}`);
  for (const s of steps) if (s.action === "FAILED") console.log("   FAILED:", s.why);
  return result;
}
