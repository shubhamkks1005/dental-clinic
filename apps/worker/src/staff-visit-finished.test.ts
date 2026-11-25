import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

// The page after a visit (handoff section 13): bill state, doctor discount, consultation, note, "after" read.
let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Finished Patient', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
});

async function call(email: string, method: string, path: string, body?: unknown) {
  const cookie = await sessionCookie(env, email);
  if (method === "GET")
    return app.request(`${ORIGIN}${path}`, { method, headers: { cookie } }, env);
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}${path}`,
    {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
    env,
  );
}

type Bill = {
  id: string;
  version: number;
  status: string;
  totalPaise: number;
  discountPaise: number;
};
const json = async (r: Response) => (await r.json()) as { data: Record<string, unknown> };
const billOf = async (r: Response) => (await json(r)).data.bill as Bill;

async function draftBill(unitPaise = 100_000) {
  const r = await call("rec@example.test", "POST", "/api/staff/bills", {
    patientId: "p1",
    billOn: "2026-11-25",
    items: [{ procedureLabel: "Filling", qty: 1, unitPaise }],
  });
  return billOf(r);
}

describe("doctor discount route (P3, P4, P5)", () => {
  it("doctor gives 10 percent and can issue at once; after issue it is refused", async () => {
    const bill = await draftBill();
    const url = `/api/staff/bills/${bill.id}/discount/apply`;
    const res = await call("doc@example.test", "POST", url, {
      version: bill.version,
      discountPercent: 10,
      reason: "courtesy",
    });
    expect(res.status).toBe(200);
    const next = await billOf(res);
    expect(next).toMatchObject({ discountPaise: 10_000, totalPaise: 90_000 });

    const issued = await call("doc@example.test", "POST", `/api/staff/bills/${bill.id}/issue`, {
      version: next.version,
    });
    expect(issued.status).toBe(200);
    const late = await call("doc@example.test", "POST", url, {
      version: next.version + 1,
      discountPercent: 20,
      reason: "other",
    });
    expect(late.status).toBe(400);
  });

  it("the receptionist gets 403; a bad body is 400", async () => {
    const bill = await draftBill();
    const url = `/api/staff/bills/${bill.id}/discount/apply`;
    expect(
      (
        await call("rec@example.test", "POST", url, {
          version: bill.version,
          discountPercent: 10,
          reason: "courtesy",
        })
      ).status,
    ).toBe(403);
    expect((await call("doc@example.test", "POST", url, { version: bill.version })).status).toBe(
      400,
    );
  });
});

async function finishedVisit(withProcedure: boolean) {
  const opened = await call("doc@example.test", "POST", "/api/staff/visits", {
    patientId: "p1",
    visitDateLocal: "2026-11-25",
  });
  const visitId = ((await opened.json()) as { data: { visit: { id: string } } }).data.visit.id;
  if (withProcedure) {
    await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/procedures`, {
      listItemId: "01M83PROC02FILLING0000001",
      toothFdi: 46,
    });
  }
  const got = await call("doc@example.test", "GET", `/api/staff/visits/${visitId}`);
  const version = ((await got.json()) as { data: { visit: { version: number } } }).data.visit
    .version;
  await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/finalise`, { version });
  return visitId;
}

describe("pass to reception route (P1, P2, P6, P10)", () => {
  it("the first tap makes and issues one bill (201), the second returns the same one (200)", async () => {
    const visitId = await finishedVisit(true);
    const url = `/api/staff/visits/${visitId}/bill`;
    const first = await call("doc@example.test", "POST", url, {});
    expect(first.status).toBe(201);
    const a = (await json(first)).data as { bill: Bill & { billNo: string }; created: boolean };
    expect(a).toMatchObject({ created: true, bill: { status: "issued" } });
    const second = await call("doc@example.test", "POST", url, {});
    expect(second.status).toBe(200);
    const b = (await json(second)).data as { bill: Bill & { billNo: string }; created: boolean };
    expect(b).toMatchObject({ created: false });
    expect(b.bill.id).toBe(a.bill.id);
    expect(b.bill.billNo).toBe(a.bill.billNo);
    const n = sqlite.prepare("SELECT COUNT(*) AS n FROM bills WHERE visit_id = ?").get(visitId) as {
      n: number;
    };
    expect(n.n).toBe(1);
  });

  it("a consultation line is added; nothing to bill is refused with a sentence", async () => {
    const visitId = await finishedVisit(true);
    const res = await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/bill`, {
      reviewFirst: true,
      consultation: true,
      consultationPaise: 30_000,
    });
    expect(res.status).toBe(201);
    const bill = (await json(res)).data.bill as Bill;
    expect(bill.status).toBe("draft");

    const empty = await finishedVisit(false);
    const none = await call("doc@example.test", "POST", `/api/staff/visits/${empty}/bill`, {});
    expect(none.status).toBe(400);
    expect(JSON.stringify(await none.json())).toContain("nothing to bill");
    const bad = await call("doc@example.test", "POST", `/api/staff/visits/${empty}/bill`, {
      consultation: true,
      consultationPaise: "lots",
    });
    expect(bad.status).toBe(400);
  });
});

describe("bill note route (P8, P9)", () => {
  it("both roles write the note of an issued bill; a long note is 400; a cancelled bill is 400", async () => {
    const bill = await draftBill();
    const issued = await billOf(
      await call("doc@example.test", "POST", `/api/staff/bills/${bill.id}/issue`, {
        version: bill.version,
      }),
    );
    const url = `/api/staff/bills/${bill.id}/note`;
    const res = await call("rec@example.test", "PATCH", url, {
      version: issued.version,
      note: "Pays on Friday",
    });
    expect(res.status).toBe(200);
    const noted = (await json(res)).data.bill as Bill & { notes: string };
    expect(noted).toMatchObject({ notes: "Pays on Friday", totalPaise: issued.totalPaise });

    expect(
      (
        await call("doc@example.test", "PATCH", url, {
          version: noted.version,
          note: "x".repeat(201),
        })
      ).status,
    ).toBe(400);
    expect((await call("doc@example.test", "PATCH", url, { note: "no version" })).status).toBe(400);

    const cancel = await call("doc@example.test", "POST", `/api/staff/bills/${bill.id}/cancel`, {
      version: noted.version,
      reason: "Test",
    });
    expect(cancel.status).toBe(200);
    const after = (await json(cancel)).data.bill as Bill;
    expect(
      (await call("doc@example.test", "PATCH", url, { version: after.version, note: "Late" }))
        .status,
    ).toBe(400);
  });
});

describe("after read and the doctor taking payment (P7, P11)", () => {
  type After = {
    billState: string;
    bill: { id: string; paidPaise: number; duePaise: number; billNo: string | null } | null;
    diagnoses: unknown[];
    procedures: unknown[];
    earlierDuesPaise: number;
  };

  it("P7: the doctor passes, then takes the full payment on the page: state goes With reception then Paid", async () => {
    const visitId = await finishedVisit(true);
    await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/bill`, {
      consultation: true,
      consultationPaise: 30_000,
    });
    const open = (
      await json(await call("doc@example.test", "GET", `/api/staff/visits/${visitId}/after`))
    ).data as unknown as After;
    expect(open.billState).toBe("with_reception");
    expect(open.bill?.billNo).toMatch(/^SB-/);
    expect(open.bill?.duePaise).toBeGreaterThan(0);
    expect(open.procedures).toHaveLength(1);

    const pay = await call("doc@example.test", "POST", "/api/staff/payments", {
      patientId: "p1",
      amountPaise: open.bill!.duePaise,
      mode: "cash",
    });
    expect(pay.status).toBe(201);
    const paid = (
      await json(await call("doc@example.test", "GET", `/api/staff/visits/${visitId}/after`))
    ).data as unknown as After;
    expect(paid).toMatchObject({ billState: "paid", bill: { duePaise: 0 } });
    expect(paid.earlierDuesPaise).toBe(0);
  });

  it("before any bill the state is Not billed; P11: the receptionist gets 403, an unknown visit 404", async () => {
    const visitId = await finishedVisit(true);
    const res = await call("doc@example.test", "GET", `/api/staff/visits/${visitId}/after`);
    expect(res.status).toBe(200);
    expect(((await json(res)).data as unknown as After).billState).toBe("not_billed");
    expect(
      (await call("rec@example.test", "GET", `/api/staff/visits/${visitId}/after`)).status,
    ).toBe(403);
    expect((await call("doc@example.test", "GET", "/api/staff/visits/nope/after")).status).toBe(
      404,
    );
  });
});
