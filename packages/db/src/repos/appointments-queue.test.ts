import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError } from "../errors";
import { countingDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const desk: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r3" };
const DAY = "2026-11-25";
const NOW = new Date("2026-11-25T05:00:00.000Z"); // 10:30 IST

let t: ReturnType<typeof countingDb>;
const repo = (ctx: Ctx = doctor) => createRepos(t.db, ctx).appointments;

function appt(
  id: string,
  startMin: number,
  status: string,
  over: { order?: number; arrived?: string } = {},
) {
  const startAt = `2026-11-25T0${Math.floor((startMin - 330) / 60)}:${String((startMin - 330) % 60).padStart(2, "0")}:00.000Z`;
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook, queue_order, arrived_at
       ) VALUES (?, 's', 's', ?, '1', 'vt1', 'Consultation', ?, ?, ?, ?, ?, 'phone', 'normal', 0, ?, ?)`,
    )
    .run(
      id,
      `p-${id}`,
      startAt,
      DAY,
      startMin,
      startMin + 30,
      status,
      over.order ?? null,
      over.arrived ?? null,
    );
}

const row = (id: string) =>
  t.sqlite.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as Record<string, unknown>;
const order = (id: string) => row(id).queue_order as number | null;
const version = (id: string) => row(id).version as number;
const auditCount = () =>
  Number(
    t.sqlite.prepare("SELECT count(*) AS n FROM audit_log WHERE table_name = 'appointments'").get()
      ?.n,
  );

// Money and message tables as a whole, to prove a queue move never touches them.
const money = () => ({
  bills: t.sqlite.prepare("SELECT * FROM bills ORDER BY id").all(),
  payments: t.sqlite.prepare("SELECT * FROM payments ORDER BY id").all(),
  outbox: t.sqlite.prepare("SELECT * FROM message_outbox ORDER BY id").all(),
});

beforeEach(() => {
  t = countingDb();
  for (const [id, role] of [
    ["doc-a", "doctor"],
    ["rec-1", "receptionist"],
    ["dev-1", "developer"],
  ]) {
    t.sqlite
      .prepare(
        "INSERT INTO users (id, email, name, role, created_by, updated_by) VALUES (?, ?, ?, ?, 's', 's')",
      )
      .run(id, `${id}@example.test`, `Test ${id}`, role);
  }
  appt("a", 600, "arrived", { arrived: "2026-11-25T04:20:00.000Z" });
  appt("b", 630, "scheduled");
  appt("c", 660, "scheduled");
  appt("d", 690, "scheduled");
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p-a', 's', 's', 'P-000001', 'Fake A', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
  t.sqlite
    .prepare(
      `INSERT INTO bills (id, created_by, updated_by, patient_id, bill_on, status, kind, total_paise, subtotal_paise)
       VALUES ('bill1', 's', 's', 'p-a', ?, 'issued', 'normal', 50000, 50000)`,
    )
    .run(DAY);
  t.sqlite
    .prepare(
      `INSERT INTO payments (id, created_by, updated_by, patient_id, amount_paise, mode, received_at, received_by, day_local)
       VALUES ('pay1', 's', 's', 'p-a', 20000, 'cash', ?, 'doc-a', ?)`,
    )
    .run(NOW.toISOString(), DAY);
  t.sqlite
    .prepare(
      `INSERT INTO message_outbox (id, created_by, updated_by, patient_id, kind, channel, template_key, params_json, status, dedupe_key, send_after, expire_at)
       VALUES ('m1', 's', 's', 'p-a', 'remind', 'sms', 't', '{}', 'queued', 'k1', ?, ?)`,
    )
    .run(NOW.toISOString(), NOW.toISOString());
});

describe("skip", () => {
  it("swaps with the next unfinished row, which becomes Next; the skipped one is Stepped out", async () => {
    const before = money();
    const out = await repo().skip("a", 1, NOW);
    expect(order("a")).toBeGreaterThan(order("b") as number);
    expect(order("b")).toBeLessThan(order("c") as number);
    expect(out.steppedOutAt).toBe(NOW.toISOString());
    expect(out.skipCount).toBe(1);
    expect(out.other?.id).toBe("b");
    expect(version("a")).toBe(2);
    expect(version("b")).toBe(2);
    expect(row("a").queue_changed_by).toBe("doc-a");
    expect(row("b").queue_changed_by).toBe("doc-a");
    expect(money()).toEqual(before);
  });

  it("numbers the unnumbered rows 10, 20, 30 ... in list order the first time", async () => {
    await repo().skip("a", 1, NOW);
    // a and b swapped: b=10, a=20, c=30, d=40
    expect([order("b"), order("a"), order("c"), order("d")]).toEqual([10, 20, 30, 40]);
  });

  it("the last unfinished row is only marked Stepped out (no swap)", async () => {
    const out = await repo().skip("d", 1, NOW);
    expect(out.other).toBeNull();
    expect(out.steppedOutAt).toBe(NOW.toISOString());
    expect(order("d")).toBe(40);
    expect(order("c")).toBe(30);
    expect(version("c")).toBe(1);
  });

  it("refuses a row in the chair and a done row, writes nothing", async () => {
    t.sqlite.prepare("UPDATE appointments SET status = 'in_chair' WHERE id = 'a'").run();
    t.sqlite.prepare("UPDATE appointments SET status = 'completed' WHERE id = 'b'").run();
    for (const id of ["a", "b"]) {
      await expect(repo().skip(id, 1, NOW)).rejects.toThrow(
        "Only a patient who is not in the chair can be skipped.",
      );
    }
    expect(order("c")).toBeNull();
    expect(auditCount()).toBe(0);
  });

  it("a stale version gives 409 and changes nothing", async () => {
    await expect(repo().skip("a", 7, NOW)).rejects.toBeInstanceOf(ConflictError);
    await expect(repo().skip("a", 7, NOW)).rejects.toThrow(
      "The list changed. Reload and try again.",
    );
    expect(order("a")).toBeNull();
    expect(row("a").stepped_out_at).toBeNull();
    expect(auditCount()).toBe(0);
  });

  it("a neighbour that changed in between makes the whole swap fail", async () => {
    // Seed numbers first so we can change the neighbour after the plan is made.
    t.sqlite.prepare("UPDATE appointments SET queue_order = 10 WHERE id = 'a'").run();
    t.sqlite.prepare("UPDATE appointments SET queue_order = 20 WHERE id = 'b'").run();
    t.sqlite.prepare("UPDATE appointments SET queue_order = 30 WHERE id = 'c'").run();
    t.sqlite.prepare("UPDATE appointments SET queue_order = 40 WHERE id = 'd'").run();
    const repoWithRace = createRepos(t.db, doctor).appointments;
    // Simulate: b is edited by someone else after we read the day, before our batch runs.
    const realBatch = t.db.batch.bind(t.db);
    (t.db as unknown as { batch: unknown }).batch = (items: Parameters<typeof realBatch>[0]) => {
      t.sqlite.prepare("UPDATE appointments SET version = version + 1 WHERE id = 'b'").run();
      return realBatch(items);
    };
    await expect(repoWithRace.skip("a", 1, NOW)).rejects.toBeInstanceOf(ConflictError);
    expect(order("a")).toBe(10);
    expect(order("b")).toBe(20);
    expect(version("a")).toBe(1);
    expect(auditCount()).toBe(0);
  });

  it("writes one audit row per changed row, in the same batch, in ONE round trip for the write", async () => {
    t.reset();
    await repo().skip("a", 1, NOW);
    expect(auditCount()).toBe(2);
    const audit = t.sqlite
      .prepare("SELECT before_json, after_json FROM audit_log WHERE row_id = 'a'")
      .get() as { before_json: string; after_json: string };
    expect(JSON.parse(audit.after_json)).toMatchObject({ skipCount: 1, version: 2 });
    expect(JSON.parse(audit.before_json)).toMatchObject({ skipCount: 0 });
    // 1 read of the day + 1 batch + 1 read-back = 3 round trips, only ONE of them a write.
    expect(t.counts().batches).toBe(1);
    expect(t.counts().roundTrips).toBe(3);
  });

  it("numbering a 30-row day costs the same single batch", async () => {
    for (let i = 0; i < 26; i++) appt(`x${i}`, 700 + i, "scheduled");
    t.reset();
    await repo().skip("a", 1, NOW);
    expect(t.counts().batches).toBe(1);
    expect(t.counts().roundTrips).toBe(3);
    expect(order("x25")).not.toBeNull();
  });

  it("the receptionist can skip, a developer cannot", async () => {
    await expect(repo(desk).skip("a", 1, NOW)).resolves.toBeTruthy();
    await expect(repo(developer).skip("b", 1, NOW)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("pull forward", () => {
  it("moves one slot up (swap with the row above)", async () => {
    const before = money();
    const out = await repo().pullForward("c", 1, NOW);
    expect(out.other?.id).toBe("b");
    expect([order("a"), order("c"), order("b"), order("d")]).toEqual([10, 20, 30, 40]);
    expect(money()).toEqual(before);
  });

  it("the first row cannot be pulled forward", async () => {
    await expect(repo().pullForward("a", 1, NOW)).rejects.toThrow("Already first in the list.");
    expect(auditCount()).toBe(0);
  });

  it("a row in the chair or done cannot be moved", async () => {
    t.sqlite.prepare("UPDATE appointments SET status = 'completed' WHERE id = 'c'").run();
    await expect(repo().pullForward("c", 1, NOW)).rejects.toThrow("This patient cannot be moved.");
  });

  it("a stale version gives 409 and changes nothing", async () => {
    await expect(repo().pullForward("c", 3, NOW)).rejects.toBeInstanceOf(ConflictError);
    expect(order("c")).toBeNull();
  });
});

describe("step out and step back", () => {
  it("step out only sets the flag; step back clears it", async () => {
    const a = await repo().stepOut("b", 1, NOW);
    expect(a.steppedOutAt).toBe(NOW.toISOString());
    expect(a.other).toBeNull();
    const back = await repo().stepBack("b", a.version, NOW);
    expect(back.steppedOutAt).toBeNull();
    expect(back.status).toBe("arrived");
  });

  it("step back turns Not arrived into Arrived and stamps arrived_at", async () => {
    const out = await repo().skip("b", 1, NOW);
    const back = await repo().stepBack("b", out.version, NOW);
    expect(back.status).toBe("arrived");
    expect(row("b").arrived_at).toBe(NOW.toISOString());
    expect(row("b").stepped_out_at).toBeNull();
  });

  it("step back on an already arrived row only clears the flag", async () => {
    const out = await repo().skip("a", 1, NOW);
    const back = await repo().stepBack("a", out.version, NOW);
    expect(back.status).toBe("arrived");
    expect(row("a").arrived_at).toBe("2026-11-25T04:20:00.000Z");
    expect(row("a").stepped_out_at).toBeNull();
  });
});

describe("late, coming today", () => {
  it("moves the same appointment to the back, same status, no money or message change", async () => {
    const before = money();
    const apptCount = Number(t.sqlite.prepare("SELECT count(*) AS n FROM appointments").get()?.n);
    const out = await repo().markLateToday("a", 1, NOW);
    expect(out.status).toBe("arrived");
    expect(order("a")).toBeGreaterThan(order("d") as number);
    expect(row("a").late_at).toBe(NOW.toISOString());
    expect(row("a").stepped_out_at).toBeNull();
    expect(Number(t.sqlite.prepare("SELECT count(*) AS n FROM appointments").get()?.n)).toBe(
      apptCount,
    );
    expect(money()).toEqual(before);
  });

  it("clears Stepped out and goes behind a done row's list position", async () => {
    await repo().stepOut("a", 1, NOW);
    await repo().markLateToday("a", 2, NOW);
    expect(row("a").stepped_out_at).toBeNull();
    expect(order("a")).toBe(50);
  });

  it("refuses a row in the chair and a stale version", async () => {
    t.sqlite.prepare("UPDATE appointments SET status = 'in_chair' WHERE id = 'b'").run();
    await expect(repo().markLateToday("b", 1, NOW)).rejects.toBeInstanceOf(ConflictError);
    await expect(repo().markLateToday("a", 5, NOW)).rejects.toBeInstanceOf(ConflictError);
    expect(row("a").late_at).toBeNull();
  });
});
