import { expect, test, type APIRequestContext } from "@playwright/test";

// Part T gate T1.G: the doctor's list over the real API. Walk-in, arrive, skip, pull forward,
// late, break (refused with a patient in the chair), approval ask and answer. Fake data only.
// Emergency walk-ins are used because they work at any time of day (they may overbook the chair).

const VISIT_TYPE = "01M83VTYPE01CONSULT000001";
const ORIGIN = "http://localhost:8787";
const HEADERS = { origin: ORIGIN, "x-clinic-request": "1", "content-type": "application/json" };

type Row = { id: string; version: number; queueOrder: number | null; status: string };
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function api(ctx: APIRequestContext, method: "GET" | "POST", path: string, body?: unknown) {
  const res = await ctx.fetch(`/api/staff${path}`, {
    method,
    headers: HEADERS,
    ...(body === undefined ? {} : { data: body }),
  });
  const json = (await res.json().catch(() => ({}))) as { data: Json; error: Json };
  return { status: res.status(), data: json.data ?? {}, error: json.error ?? {} };
}

// The scratch database is shared by every spec: start from a free chair and no break.
async function clearDay(doc: APIRequestContext) {
  const cur = await api(doc, "GET", "/breaks/current");
  const b = cur.data.current as { id: string; version: number } | null;
  if (b) await api(doc, "POST", `/breaks/${b.id}/end`, { version: b.version });
  const day = await api(doc, "GET", "/appointments");
  for (const a of (day.data.appointments ?? []) as Array<{
    id: string;
    status: string;
    version: number;
  }>) {
    if (a.status === "in_chair")
      await api(doc, "PATCH", `/appointments/${a.id}/status`, {
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
      await api(doc, "POST", `/appointments/${a.id}/cancel`, {
        version: a.version,
        reason: "patient_request",
      });
    }
  }
}

async function signIn(playwright: typeof import("@playwright/test"), role: string) {
  const ctx = await playwright.request.newContext({ baseURL: ORIGIN });
  const res = await ctx.get(`/api/staff/auth/dev-login?role=${role}`);
  expect(res.ok()).toBe(true);
  return ctx;
}

test("queue API: walk-ins, skip, pull forward, late, break, approvals", async ({ playwright }) => {
  test.setTimeout(90_000);
  const doc = await signIn(playwright, "doctor");
  const desk = await signIn(playwright, "receptionist");
  await clearDay(doc);
  const stamp = Date.now().toString().slice(-6);

  // Three patients arrive as emergency walk-ins.
  const ids: string[] = [];
  for (let i = 0; i < 3; i++) {
    const patient = await api(desk, "POST", "/patients", {
      fullName: `Queue Test ${stamp} ${i}`,
      gender: "female",
      ageYearsAtReg: 30,
      mobile: `9${i}00${stamp}`,
    });
    expect(patient.status, JSON.stringify(patient.error)).toBe(201);
    const walkIn = await api(desk, "POST", "/appointments/walk-in", {
      patientId: patient.data.patient?.id ?? patient.data.id,
      visitTypeId: VISIT_TYPE,
      priority: "emergency",
    });
    expect(walkIn.status, JSON.stringify(walkIn.error)).toBe(201);
    ids.push(walkIn.data.appointment.id);
  }

  const today = async () => {
    const r = await api(doc, "GET", "/appointments");
    expect(r.status).toBe(200);
    const mine = (r.data.appointments as Row[]).filter((a) => ids.includes(a.id));
    return { reply: r.data, rows: mine };
  };
  const byId = (rows: Row[], id: string) => rows.find((r) => r.id === id) as Row;

  // Nobody has reordered: no saved numbers yet, and the reply has the new fields.
  const start = await today();
  const [a, b, c] = ids as [string, string, string];

  // The desk skips the first row: it swaps with the next one and is marked Stepped out.
  const skip = await api(desk, "POST", `/appointments/${a}/skip`, {
    version: byId(start.rows, a).version,
  });
  expect(skip.status, JSON.stringify(skip.error)).toBe(200);
  expect(skip.data.move.other.id).toBe(b);
  const stale = await api(desk, "POST", `/appointments/${a}/skip`, { version: 1 });
  expect(stale.status).toBe(409);
  const afterSkip = await today();
  expect(byId(afterSkip.rows, b).queueOrder).toBeLessThan(
    byId(afterSkip.rows, a).queueOrder as number,
  );
  expect(afterSkip.reply.lastOrderChange.byName).toBeTruthy();
  // The order is saved: a fresh read gives the same answer.
  expect((await today()).rows.map((r) => [r.id, r.queueOrder])).toEqual(
    afterSkip.rows.map((r) => [r.id, r.queueOrder]),
  );

  // Pull forward: c moves one slot up.
  const pull = await api(doc, "POST", `/appointments/${c}/pull-forward`, {
    version: byId(afterSkip.rows, c).version,
  });
  expect(pull.status, JSON.stringify(pull.error)).toBe(200);
  const first = await api(
    doc,
    "POST",
    `/appointments/${(await today()).rows.sort((x, y) => (x.queueOrder ?? 0) - (y.queueOrder ?? 0))[0]!.id}/pull-forward`,
    { version: 1 },
  );
  expect(first.status).toBe(409);

  // Late, coming today: the same appointment goes to the back.
  const beforeLate = await today();
  const frontId = [...beforeLate.rows].sort((x, y) => (x.queueOrder ?? 0) - (y.queueOrder ?? 0))[0]!
    .id;
  const late = await api(desk, "POST", `/appointments/${frontId}/late`, {
    version: byId(beforeLate.rows, frontId).version,
  });
  expect(late.status, JSON.stringify(late.error)).toBe(200);
  const afterLate = await today();
  const sorted = [...afterLate.rows].sort((x, y) => (x.queueOrder ?? 0) - (y.queueOrder ?? 0));
  expect(sorted.at(-1)!.id).toBe(frontId);
  expect(afterLate.rows).toHaveLength(3);

  // Break: refused with a patient in the chair, allowed once the chair is empty.
  const chairId = sorted[0]!.id;
  const patch = await doc.fetch(`/api/staff/appointments/${chairId}/status`, {
    method: "PATCH",
    headers: HEADERS,
    data: { status: "in_chair", version: byId((await today()).rows, chairId).version },
  });
  expect(patch.status(), await patch.text()).toBe(200);
  const refused = await api(doc, "POST", "/breaks", { minutes: 5 });
  expect(refused.status).toBe(409);
  expect(refused.error.message).toBe("Finish the visit in the chair first.");
  const done = await doc.fetch(`/api/staff/appointments/${chairId}/status`, {
    method: "PATCH",
    headers: HEADERS,
    data: { status: "completed", version: byId((await today()).rows, chairId).version },
  });
  expect(done.status()).toBe(200);
  expect((await api(desk, "POST", "/breaks", { minutes: 5 })).status).toBe(403);
  const brk = await api(doc, "POST", "/breaks", { minutes: 10, label: "Short breather" });
  expect(brk.status, JSON.stringify(brk.error)).toBe(201);
  const breakId = brk.data.current.id as string;
  expect((await today()).reply.currentBreak.id).toBe(breakId);
  const plus = await api(doc, "POST", `/breaks/${breakId}/adjust`, { deltaMinutes: 5, version: 1 });
  expect(plus.data.current.minutes).toBe(15);
  const minus = await api(doc, "POST", `/breaks/${breakId}/adjust`, {
    deltaMinutes: -5,
    version: 2,
  });
  expect(minus.data.current.minutes).toBe(10);
  expect((await api(doc, "POST", `/breaks/${breakId}/end`, { version: 3 })).status).toBe(200);
  expect((await api(desk, "GET", "/breaks/current")).data.current).toBeNull();

  // Approvals: the desk asks, the doctor answers, the desk sees the answer.
  const ask = {
    type: "emergency_insert",
    appointmentId: b,
    note: "Pain, wants 3 PM",
    urgent: true,
  };
  const created = await api(desk, "POST", "/approvals", ask);
  expect(created.status, JSON.stringify(created.error)).toBe(201);
  expect((await api(desk, "POST", "/approvals", ask)).status).toBe(409);
  expect((await api(doc, "POST", "/approvals", ask)).status).toBe(403);
  const list = await api(doc, "GET", "/approvals");
  expect((list.data.approvals as Json[]).some((x) => x.id === created.data.id)).toBe(true);
  expect(
    (
      await api(desk, "POST", `/approvals/${created.data.id}/answer`, {
        decision: "approve",
        version: 1,
      })
    ).status,
  ).toBe(403);
  const answer = await api(doc, "POST", `/approvals/${created.data.id}/answer`, {
    decision: "approve",
    note: "Yes",
    version: 1,
  });
  expect(answer.status, JSON.stringify(answer.error)).toBe(200);
  const mine = await api(desk, "GET", "/approvals");
  expect((mine.data.approvals as Json[])[0]).toMatchObject({
    status: "approved",
    answerNote: "Yes",
  });

  await doc.dispose();
  await desk.dispose();
});
