import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const desk: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r3" };
const NOW = new Date("2026-11-25T06:30:00.000Z"); // 12:00 IST
const DAY = "2026-11-25";

let t: ReturnType<typeof testDb>;
const breaks = (ctx: Ctx = doctor) => createRepos(t.db, ctx).breaks;
const count = (sql: string) => Number(t.sqlite.prepare(sql).get()?.n);

// Tables that a break must never touch.
const snapshot = () => ({
  appointments: t.sqlite.prepare("SELECT * FROM appointments ORDER BY id").all(),
  bills: t.sqlite.prepare("SELECT * FROM bills ORDER BY id").all(),
  payments: t.sqlite.prepare("SELECT * FROM payments ORDER BY id").all(),
  outbox: t.sqlite.prepare("SELECT * FROM message_outbox ORDER BY id").all(),
});

function appt(id: string, status: string) {
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook
       ) VALUES (?, 's', 's', 'p1', '1', 'vt1', 'Consultation', '2026-11-25T05:00:00.000Z', ?, 630, 660, ?, 'phone', 'normal', 0)`,
    )
    .run(id, DAY, status);
}

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 's', 's', 'P-000001', 'Fake One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
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
});

describe("start a break", () => {
  it("starts, and is the current break for today", async () => {
    const b = await breaks().startBreak({ minutes: 15, label: "Coffee & reset" }, NOW);
    expect(b).toMatchObject({ minutes: 15, label: "Coffee & reset", version: 1 });
    expect(await breaks().currentBreak(DAY)).toMatchObject({ id: b.id, minutes: 15 });
    expect(count("SELECT count(*) AS n FROM audit_log WHERE table_name = 'doctor_breaks'")).toBe(1);
  });

  it("is refused while someone is in the chair", async () => {
    appt("a1", "in_chair");
    await expect(breaks().startBreak({ minutes: 5 }, NOW)).rejects.toThrow(
      "Finish the visit in the chair first.",
    );
    expect(count("SELECT count(*) AS n FROM doctor_breaks")).toBe(0);
  });

  it("is allowed with people waiting, and changes none of them", async () => {
    appt("a1", "arrived");
    appt("a2", "scheduled");
    const before = snapshot();
    await breaks().startBreak({ minutes: 45, label: "Lunch break" }, NOW);
    expect(snapshot()).toEqual(before);
  });

  it("only one break can be open", async () => {
    await breaks().startBreak({ minutes: 5 }, NOW);
    await expect(breaks().startBreak({ minutes: 10 }, NOW)).rejects.toThrow(
      "A break is already on.",
    );
    expect(count("SELECT count(*) AS n FROM doctor_breaks")).toBe(1);
  });

  it("only the doctor may start one", async () => {
    await expect(breaks(desk).startBreak({ minutes: 5 }, NOW)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(breaks(developer).startBreak({ minutes: 5 }, NOW)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe("adjust and end", () => {
  it("+5 and -5 work and bump the version", async () => {
    const b = await breaks().startBreak({ minutes: 15 }, NOW);
    const plus = await breaks().adjustBreak(b.id, 5, 1, NOW);
    expect(plus).toMatchObject({ minutes: 20, version: 2 });
    const minus = await breaks().adjustBreak(b.id, -5, 2, NOW);
    expect(minus).toMatchObject({ minutes: 15, version: 3 });
  });

  it("under 5 and over 120 minutes is refused (400) and changes nothing", async () => {
    const b = await breaks().startBreak({ minutes: 5 }, NOW);
    await expect(breaks().adjustBreak(b.id, -5, 1, NOW)).rejects.toBeInstanceOf(InvalidError);
    await expect(breaks().adjustBreak(b.id, -5, 1, NOW)).rejects.toThrow(
      "A break must be between 5 and 120 minutes.",
    );
    const long = await breaks().startBreak({ minutes: 120 }, new Date("2026-11-26T06:30:00.000Z"));
    await expect(breaks().adjustBreak(long.id, 5, 1, NOW)).rejects.toThrow(
      "A break must be between 5 and 120 minutes.",
    );
    expect(count("SELECT minutes AS n FROM doctor_breaks WHERE id = '" + b.id + "'")).toBe(5);
  });

  it("a stale version gives 409", async () => {
    const b = await breaks().startBreak({ minutes: 10 }, NOW);
    await expect(breaks().adjustBreak(b.id, 5, 9, NOW)).rejects.toBeInstanceOf(ConflictError);
    await expect(breaks().endBreak(b.id, 9, NOW)).rejects.toBeInstanceOf(ConflictError);
  });

  it("end closes it: no current break, and it cannot be changed or ended twice", async () => {
    const b = await breaks().startBreak({ minutes: 10 }, NOW);
    await breaks().endBreak(b.id, 1, NOW);
    expect(await breaks().currentBreak(DAY)).toBeNull();
    await expect(breaks().adjustBreak(b.id, 5, 2, NOW)).rejects.toThrow("already over");
    await expect(breaks().endBreak(b.id, 2, NOW)).rejects.toThrow("already over");
  });

  it("a new break can start after the last one ended", async () => {
    const b = await breaks().startBreak({ minutes: 10 }, NOW);
    await breaks().endBreak(b.id, 1, NOW);
    await expect(breaks().startBreak({ minutes: 5 }, NOW)).resolves.toBeTruthy();
  });

  it("an open break from yesterday is not today's current break, and ending it works", async () => {
    const old = await breaks().startBreak({ minutes: 10 }, new Date("2026-11-24T06:30:00.000Z"));
    expect(await breaks().currentBreak(DAY)).toBeNull();
    await expect(breaks().startBreak({ minutes: 5 }, NOW)).resolves.toBeTruthy();
    await breaks().endBreak(old.id, 1, NOW);
  });

  it("both roles can read the current break; a developer cannot", async () => {
    await breaks().startBreak({ minutes: 10 }, NOW);
    expect(await breaks(desk).currentBreak(DAY)).not.toBeNull();
    await expect(breaks(developer).currentBreak(DAY)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
