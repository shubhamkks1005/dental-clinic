import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const APPT_ID = "01M83APPTSTATUSTEST00001";
const START_AT = "2026-11-23T04:30:00.000Z"; // 10:00 IST

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Status', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook, version, updated_at
       ) VALUES (
         ?, 'system', 'system', 'p1', '1', 'vt1', 'Consultation',
         ?, '2026-11-23', 600, 630, 'scheduled', 'phone', 'normal', 0, 1, ?
       )`,
    )
    .run(APPT_ID, START_AT, START_AT);
});

describe("appointment status change (2.3.6)", () => {
  it("scheduled → confirmed → arrived stamps arrived_at; illegal jump is conflict", async () => {
    const now = new Date("2026-11-23T04:00:00.000Z");
    const confirmed = await repos().appointments.changeStatus(
      APPT_ID,
      { status: "confirmed", version: 1, cancelReason: null },
      now,
    );
    expect(confirmed).toMatchObject({ status: "confirmed", version: 2 });
    const arrived = await repos().appointments.changeStatus(
      APPT_ID,
      { status: "arrived", version: 2, cancelReason: null },
      now,
    );
    expect(arrived.status).toBe("arrived");
    expect(arrived.arrivedAt).toBe(now.toISOString());
    await expect(
      repos().appointments.changeStatus(
        APPT_ID,
        { status: "completed", version: 3, cancelReason: null },
        now,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("arrived → in_chair → completed stamps started_at and ended_at", async () => {
    t.sqlite.prepare(`UPDATE appointments SET status = 'arrived', version = 2`).run();
    const t1 = new Date("2026-11-23T05:00:00.000Z");
    const chair = await repos().appointments.changeStatus(
      APPT_ID,
      { status: "in_chair", version: 2, cancelReason: null },
      t1,
    );
    expect(chair.startedAt).toBe(t1.toISOString());
    const t2 = new Date("2026-11-23T05:30:00.000Z");
    const done = await repos().appointments.changeStatus(
      APPT_ID,
      { status: "completed", version: 3, cancelReason: null },
      t2,
    );
    expect(done).toMatchObject({ status: "completed", endedAt: t2.toISOString() });
  });

  it("no_show before start+15m is refused; after is allowed", async () => {
    const tooSoon = new Date(new Date(START_AT).getTime() + 5 * 60 * 1000);
    await expect(
      repos().appointments.changeStatus(
        APPT_ID,
        { status: "no_show", version: 1, cancelReason: null },
        tooSoon,
      ),
    ).rejects.toBeInstanceOf(InvalidError);
    const ok = new Date(new Date(START_AT).getTime() + 15 * 60 * 1000);
    await expect(
      repos().appointments.changeStatus(
        APPT_ID,
        { status: "no_show", version: 1, cancelReason: null },
        ok,
      ),
    ).resolves.toMatchObject({ status: "no_show" });
  });

  it("cancelled → scheduled within 24h; after 24h refused", async () => {
    const cancelledAt = new Date("2026-11-23T06:00:00.000Z");
    t.sqlite
      .prepare(`UPDATE appointments SET status = 'cancelled', version = 2, updated_at = ?`)
      .run(cancelledAt.toISOString());
    const within = new Date(cancelledAt.getTime() + 2 * 60 * 60 * 1000);
    await expect(
      repos().appointments.changeStatus(
        APPT_ID,
        { status: "scheduled", version: 2, cancelReason: null },
        within,
      ),
    ).resolves.toMatchObject({ status: "scheduled" });

    t.sqlite
      .prepare(`UPDATE appointments SET status = 'no_show', version = 4, updated_at = ?`)
      .run(cancelledAt.toISOString());
    const late = new Date(cancelledAt.getTime() + 25 * 60 * 60 * 1000);
    await expect(
      repos().appointments.changeStatus(
        APPT_ID,
        { status: "scheduled", version: 4, cancelReason: null },
        late,
      ),
    ).rejects.toBeInstanceOf(InvalidError);
  });

  it("stale version is conflict", async () => {
    await repos().appointments.changeStatus(
      APPT_ID,
      { status: "confirmed", version: 1, cancelReason: null },
      new Date("2026-11-23T04:00:00.000Z"),
    );
    await expect(
      repos().appointments.changeStatus(
        APPT_ID,
        { status: "arrived", version: 1, cancelReason: null },
        new Date("2026-11-23T04:05:00.000Z"),
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
