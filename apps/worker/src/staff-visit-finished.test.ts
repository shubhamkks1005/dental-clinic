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
