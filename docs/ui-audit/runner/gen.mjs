import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
const ROOT = "/Users/shubham.kumar/dental-clinic/docs/ui-audit/flows";
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(ROOT).filter((d) => existsSync(`${ROOT}/${d}/result.json`) && existsSync(`${ROOT}/${d}/verdict.json`));
const clean = (t) => String(t || "").replace(/\n×/g, "").replace(/\|/g, "/").replace(/\s+/g, " ").trim();
for (const id of ids) {
  const r = JSON.parse(readFileSync(`${ROOT}/${id}/result.json`, "utf8")), v = JSON.parse(readFileSync(`${ROOT}/${id}/verdict.json`, "utf8"));
  const m = r.metrics, sp = r.spec;
  let o = `# ${id}: ${v.title}\n\n`;
  o += `**Aim:** ${v.aim}\n\n`;
  o += `**Who / device:** ${v.who}. Browser: Chromium ${sp.vp === "phone" ? "360 px" : sp.vp === "tablet" ? "768 px" : "1366 px"}. Fake data only.\n\n`;
  o += `**Starting state:** ${v.pre}\n\n`;
  o += `**Result: ${v.verdict}.** ${v.summary}\n\n`;
  o += `| Measure | Value |\n|---|---|\n| Steps recorded | ${m.stepCount} |\n| Clicks / key presses to finish | ${m.clicks} |\n| Fields typed or chosen | ${m.typedFields} |\n| Distinct pages used | ${m.pagesVisited.length} (${m.pagesVisited.map((p) => p.replace(/[0-9A-Z]{26}/g, ":id")).filter((x, i, a) => a.indexOf(x) === i).join(", ")}) |\n| Calls that would fail for a real user because of bug C1 | ${m.c1UnwrappedCalls} (the test harness repaired them so the flow could continue) |\n| Failed server calls | ${m.failedRequests.length ? m.failedRequests.join("; ") : "none"} |\n\n`;
  o += `## Problems found in this flow\n\n`;
  if (v.problems.length) { o += `| # | Priority | Step | Problem | Why it matters | Suggested fix |\n|---|---|---|---|---|---|\n`; v.problems.forEach((p, i) => { o += `| ${p.id || i + 1} | ${p.sev} | ${p.step || "-"} | ${p.text} | ${p.why || ""} | ${p.fix || ""} |\n`; }); } else o += "None.\n";
  if (v.good?.length) o += `\n## Worked well\n\n${v.good.map((g) => `- ${g}`).join("\n")}\n`;
  if (v.notTested?.length) o += `\n## Not covered by this run\n\n${v.notTested.map((g) => `- ${g}`).join("\n")}\n`;
  o += `\n## Step by step (what the user does, and what the screen did)\n\nEvidence labels: every line is [seen] in the browser unless marked otherwise. Screenshots exist only where the screen changed.\n\n`;
  for (const s of r.steps) {
    const vis = s.visible || {}; const bits = [];
    if (vis.toasts?.length) bits.push("toast: " + clean(vis.toasts[0]));
    if (vis.alerts?.length) bits.push("error shown: " + clean(vis.alerts[0]));
    if (vis.dialog?.length) bits.push("dialog open: " + clean(vis.dialog[0]).slice(0, 110));
    if (s.errors?.length) bits.push("server replied: " + s.errors.join(", "));
    const head = s.action === "note" ? `Note: ${clean(s.why)}` : `**${s.n}.** ${clean(s.why)}`;
    o += `${head} \`${s.url || ""}\`${bits.length ? "  \n   → " + bits.join("; ") : ""}\n`;
    if (s.shot) o += `\n![step ${s.n}](${id}/${s.shot})\n\n`;
  }
  writeFileSync(`${ROOT}/${id}.md`, o);
  console.log("wrote", id + ".md", o.length);
}
