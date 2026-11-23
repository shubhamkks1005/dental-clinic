import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "B02-reschedule-or-cancel-a-future-booking", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]");
  await c.go("/app/appointments?date=2026-11-24", "Receptionist opens tomorrow's calendar (a patient phones to move or cancel their booking)");
  await c.click(p.getByRole("button", { name: /Bina Testcas/ }), "Click the patient's appointment block");
  await c.look("Detail panel: what can the receptionist do here?");
  console.log("panel buttons:", (await p.locator("aside button, aside a").allInnerTexts()).join(" ¦ "));
  const blk = p.getByRole("button", { name: /Bina Testcas/ }).first(); const box = await blk.boundingBox();
  await c.look("Before the drag");
  await p.mouse.move(box.x + 100, box.y + 10); await p.mouse.down(); await p.mouse.move(box.x + 100, box.y + 200, { steps: 12 }); await p.mouse.up();
  await c.look("After trying to drag the block lower (reschedule by dragging)");
  console.log("dialog:", (await d().innerText().catch(() => "none")).replace(/\n+/g, " | ").slice(0, 400));
  await c.go("/app/patients", "Try the patient's profile instead");
  await c.click(p.getByRole("link", { name: "Bina Testcase" }).first(), "Open Bina's profile");
  await c.click(p.getByRole("tab", { name: "Appointments", exact: true }), "Open the Appointments tab");
  await c.look("Profile Appointments tab: is there a Cancel or Reschedule?");
});
