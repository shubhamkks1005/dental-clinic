import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "F01-receptionist-opens-doctor-only-pages", role: "doctor", vp: "laptop" }, async (c) => {
  const p = c.page; const B = "http://localhost:8787";
  // doctor collects ids
  await c.go("/app/patients", "The doctor looks up real record ids first (a finalised visit, its prescription, the patient)");
  await c.click(p.getByRole("link", { name: "Neha Testcase" }).first(), "Open Neha Testcase");
  const pid = p.url().split("/").pop();
  await c.click(p.getByRole("tab", { name: "Visits", exact: true }), "Open the Visits tab");
  await c.click(p.getByRole("link", { name: /2026/ }).first(), "Open the finalised visit");
  const vid = p.url().split("/").pop();
  const rxr = await p.request.get(`${B}/api/staff/visits/${vid}/prescriptions`); const rxj = await rxr.json().catch(() => ({}));
  const rid = rxj?.data?.prescriptions?.[0]?.id || "none";
  c.note(`Doctor's ids: patient ${pid}, visit ${vid}, prescription ${rid}. Doctor API reads: visit prescriptions HTTP ${rxr.status()}`);
  // receptionist
  await c.as("receptionist", "NOW the receptionist (who must never see clinical data) types the doctor's URLs");
  const pages = [
    ["Finalised visit", `/app/visits/${vid}`], ["Prescription print", `/app/print/prescription/${rid}`], ["History summary print", `/app/print/history-summary/${pid}`],
    ["New certificate", `/app/patients/${pid}/certificates/new`], ["Certificate register", "/app/certificates"], ["Error log", "/app/errors"], ["Patient requests", "/app/requests"],
    ["Settings > Staff", "/app/settings/staff"], ["Settings > Medicines", "/app/settings/medicines"], ["Settings > Billing", "/app/settings/billing"], ["Reports", "/app/reports"],
    ["Consent print (allowed)", `/app/print/consent/${pid}`]
  ];
  for (const [name, url] of pages) {
    await p.goto(B + url); await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(500);
    const t = ((await p.locator("main").innerText().catch(() => "")) || (await p.locator("body").innerText())).replace(/\n+/g, " | ").slice(0, 200);
    c.note(`PAGE ${name} ${url.replace(/[0-9A-Z]{26}/g, ":id")} => ${t}`);
    await c.look("Receptionist opens: " + name);
  }
  const apis = [["visit", `/api/staff/visits/${vid}`], ["visit prescriptions", `/api/staff/visits/${vid}/prescriptions`], ["error log", "/api/staff/errors"], ["requests", "/api/staff/requests"], ["staff list", "/api/staff/staff"], ["chart events", `/api/staff/patients/${pid}/chart`], ["history feed", `/api/staff/patients/${pid}/history`]];
  for (const [name, url] of apis) { const r = await p.request.get(B + url); const tx = await r.text(); let extra = ""; if (name === "history feed") { try { extra = " entry types: " + [...new Set(JSON.parse(tx).data.entries.map((e) => e.type))].join(","); } catch {} } c.note(`API ${name} ${url.replace(/[0-9A-Z]{26}/g, ":id")} => HTTP ${r.status()} ${tx.slice(0, 110).replace(/\n/g, " ")}${extra}`); }
});
