import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
const require = createRequire("/Users/shubham.kumar/dental-clinic/package.json");
export const { chromium } = require("@playwright/test");
export const BASE = "http://localhost:8787";
export const OUT = "/Users/shubham.kumar/dental-clinic/docs/ui-audit/screenshots";
export const VP = { phone: { width: 360, height: 780 }, tablet: { width: 768, height: 1024 }, laptop: { width: 1366, height: 768 } };
export async function open(role, vp) {
  const browser = await chromium.launch({ executablePath: "/Users/shubham.kumar/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell" });
  const ctx = await browser.newContext({ viewport: VP[vp], hasTouch: vp !== "laptop" });
  const page = await ctx.newPage();
  const issues = { console: [], failed: [] };
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) issues.console.push(m.type() + ": " + m.text().slice(0, 200)); });
  page.on("response", (r) => { if (r.status() >= 400) issues.failed.push(r.status() + " " + r.url().replace(BASE, "")); });
  issues.unwrapped = 0; // kept so lib2 metrics still print; always 0 now that C1 is fixed
  if (role) await page.goto(`${BASE}/api/staff/auth/dev-login?role=${role}`);
  return { browser, ctx, page, issues };
}
export async function shot(page, rel, full = true) {
  const p = `${OUT}/${rel}.png`; mkdirSync(dirname(p), { recursive: true });
  await page.screenshot({ path: p, fullPage: full });
  return rel;
}
// layout measurements
export async function measure(page) {
  return page.evaluate(() => {
    const vw = innerWidth;
    const over = document.documentElement.scrollWidth > vw + 1;
    const small = [];
    document.querySelectorAll("a,button,input,select,textarea,[role=tab],[role=button]").forEach((e) => {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (getComputedStyle(e).visibility === "hidden") return;
      if (r.height < 44 || r.width < 44) small.push((e.innerText || e.getAttribute("aria-label") || e.name || e.tagName).trim().slice(0, 24) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    const h1 = [...document.querySelectorAll("h1")].map((h) => h.innerText);
    return { over, scrollW: document.documentElement.scrollWidth, vw, smallCount: small.length, small: small.slice(0, 8), h1 };
  });
}
