import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "G10-two-screens-same-record", role: "doctor", vp: "laptop" }, async (c) => {
  const A = c.page; const ctx = A.context(); const B = await ctx.newPage();
  const settle = async (pg) => { await pg.waitForLoadState("networkidle").catch(() => {}); await pg.waitForTimeout(600); };
  const msg = async (pg) => (await pg.locator(".error-text, [role=alert], [role=status], .toast").allInnerTexts()).join(" / ").replace(/\n+/g, " ").slice(0, 260);
  // un-double encoded bodies on page B as well (test harness repair of C1)
  await B.route("**/api/staff/**", async (route) => { const r = route.request(); const d = r.postData(); if (r.method() !== "GET" && d) { try { const v = JSON.parse(d); if (typeof v === "string") return route.continue({ postData: v }); } catch {} } return route.continue(); });
  // ---- Part 1: same visit in two tabs ----
  await c.go("/app", "PART 1: the doctor has the same visit open in two browser tabs (A and B)");
  await c.click(A.getByRole("button", { name: "Open visit" }).or(A.getByRole("link", { name: "Open visit" })).first(), "Tab A: open the visit");
  const visitUrl = A.url();
  await B.goto(visitUrl); await settle(B);
  await c.type(A.getByLabel("Complaint"), "Complaint typed in tab A", "Tab A: type the chief complaint"); await A.waitForTimeout(2200);
  c.note("Tab A after 2 s: " + (await msg(A)));
  await B.getByText("More: history, gums, vitals").click(); await B.getByLabel("Gums").fill("Gums typed in tab B"); await B.waitForTimeout(2200);
  c.note("Tab B (opened before A typed) after typing and 2 s: " + (await msg(B)));
  await B.screenshot({ path: "/Users/shubham.kumar/dental-clinic/docs/ui-audit/flows/G10-two-screens-same-record/tabB-after-typing.jpg", type: "jpeg", quality: 55 });
  await B.reload(); await settle(B);
  c.note("After reloading tab B the saved values are: complaint='" + (await B.getByLabel("Complaint").inputValue()) + "', gums='" + (await B.getByLabel("Gums").inputValue()) + "'");
  // ---- Part 2: two tabs take a payment ----
  await c.as("receptionist", "PART 2: the receptionist has Neha's Billing tab open in two tabs (both show ₹2,500 due)");
  await c.go("/app/patients", "Patients");
  await c.click(A.getByRole("link", { name: "Neha Testcase" }).first(), "Tab A: open Neha");
  const nurl = A.url(); await c.click(A.getByRole("tab", { name: "Billing", exact: true }), "Tab A: Billing tab");
  await B.goto(nurl); await settle(B); await B.getByRole("tab", { name: "Billing", exact: true }).click(); await settle(B);
  await c.type(A.getByLabel(/Amount/).first(), "2000", "Tab A: type 2000"); await c.click(A.getByRole("button", { name: "Record payment" }), "Tab A: Record payment ₹2,000");
  c.note("Tab A now: " + ((await A.locator("main").innerText()).match(/Outstanding: [^\n]*/) || [""])[0]);
  await B.getByLabel(/Amount/).first().fill("1000"); await B.getByRole("button", { name: "Record payment" }).click(); await B.waitForTimeout(1500);
  c.note("Tab B (stale, still thought ₹2,500 was due) recorded ₹1,000: " + ((await B.locator("main").innerText()).match(/Outstanding: [^\n]*/) || [""])[0] + " | msg: " + (await msg(B)));
  await B.screenshot({ path: "/Users/shubham.kumar/dental-clinic/docs/ui-audit/flows/G10-two-screens-same-record/tabB-after-stale-payment.jpg", type: "jpeg", quality: 55 });
});
