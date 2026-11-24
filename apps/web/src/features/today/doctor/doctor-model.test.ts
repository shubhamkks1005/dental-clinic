import { istLocalToUtc, type DayWindow } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import type { DayAppointment } from "../../appointments/api";
import { buildDoctorModel, lunchOf } from "./doctor-model";
import { pillHasDot, PILL_CLASS, rowAction, rowLabel } from "./row-status";

const DAY = "2026-11-25";
const at = (min: number) => istLocalToUtc(DAY, min);
const WINDOW: DayWindow = {
  dateLocal: DAY,
  dayStartMin: 600,
  dayEndMin: 1140,
  slotMinutes: 15,
  intervals: [
    [600, 780],
    [825, 1140],
  ],
  closed: false,
};

function appt(id: string, startMin: number, over: Partial<DayAppointment> = {}): DayAppointment {
  return {
    id,
    patientId: `p-${id}`,
    patientCode: `P-0000${id.length}`,
    patientName: `Patient ${id}`,
    patientMobile: null,
    visitTypeId: "vt",
    visitTypeLabel: "Consultation",
    startAt: at(startMin).toISOString(),
    dateLocal: DAY,
    startMin,
    endMin: startMin + 30,
    status: "scheduled",
    priority: "normal",
    overbook: false,
    complaint: null,
    arrivedAt: null,
    startedAt: null,
    endedAt: null,
    updatedAt: at(startMin).toISOString(),
    version: 1,
    ...over,
  };
}
const arrived = (id: string, startMin: number, waitedMin: number, now: Date) =>
  appt(id, startMin, {
    status: "arrived",
    arrivedAt: new Date(now.getTime() - waitedMin * 60_000).toISOString(),
  });

describe("doctor Today model (T2.2, T2.4)", () => {
  const now = at(660); // 11:00

  it("counts waiting, not yet arrived and done; the chair patient is not in the list", () => {
    const m = buildDoctorModel(
      [
        appt("chair", 630, { status: "in_chair", startedAt: at(640).toISOString() }),
        arrived("w1", 660, 12, now),
        arrived("w2", 690, 4, now),
        appt("n1", 720),
        appt("d1", 600, { status: "completed" }),
        appt("x", 700, { status: "cancelled" }),
      ],
      WINDOW,
      now,
    );
    expect([m.waiting, m.notArrived, m.done]).toEqual([2, 1, 1]);
    expect(m.chair?.id).toBe("chair");
    expect(m.chair?.sinceLabel).toBe("10:40 AM");
    expect(m.rows.map((r) => r.id)).toEqual(["w1", "w2", "n1", "d1"]);
    expect(m.total).toBe(5);
  });

  it("the first arrived row that has not stepped out is Next", () => {
    const m = buildDoctorModel(
      [appt("n0", 640), arrived("w1", 660, 5, now), arrived("w2", 690, 2, now)],
      WINDOW,
      now,
    );
    expect(m.rows.map((r) => [r.id, r.isNext])).toEqual([
      ["w1", true],
      ["w2", false],
      ["n0", false],
    ]);
  });

  it("a stepped-out row is never Next, and says Stepped out", () => {
    const m = buildDoctorModel(
      [arrived("w1", 650, 5, now), { ...arrived("w2", 660, 5, now), queueOrder: 20 }].map((a, i) =>
        i === 0 ? { ...a, queueOrder: 10, steppedOutAt: now.toISOString() } : a,
      ),
      WINDOW,
      now,
    );
    expect(m.rows[0]).toMatchObject({
      id: "w1",
      kind: "stepped_out",
      pill: "Stepped out",
      isNext: false,
    });
    expect(m.rows[1]?.isNext).toBe(true);
  });

  it("row pills: waiting with minutes, hours format, not arrived, late, done", () => {
    const m = buildDoctorModel(
      [
        arrived("w1", 600, 72, now),
        appt("n1", 700),
        { ...arrived("l1", 610, 3, now), lateAt: now.toISOString() },
        appt("d1", 540, { status: "completed" }),
      ],
      WINDOW,
      now,
    );
    const pill = (id: string) => m.rows.find((r) => r.id === id)?.pill;
    expect(pill("w1")).toBe("Waiting 1 h 12 min");
    expect(pill("n1")).toBe("Not arrived");
    expect(pill("l1")).toBe("Late");
    expect(pill("d1")).toBe("Done");
  });

  it("shows Exp only when the expected start is 5 or more minutes from the booked time", () => {
    const m = buildDoctorModel(
      [
        { ...arrived("w1", 630, 5, now), queueOrder: 10 },
        { ...arrived("w2", 700, 5, now), queueOrder: 20 },
      ],
      WINDOW,
      now,
    );
    // The chair is free: the first starts now (11:00) instead of 10:30 -> Exp 11:00; the second at 11:30 vs 11:40 booked -> 11:40 is later, so no Exp.
    expect(m.rows[0]?.exp).toBe("Exp 11:00 AM");
    expect(m.rows[1]?.exp).toBeNull();
  });

  it("the late chip: minutes the first patient will start after the booked time, over the limit only", () => {
    const late = buildDoctorModel([arrived("w1", 630, 5, now)], WINDOW, now);
    expect(late.lateMinutes).toBe(30);
    const ok = buildDoctorModel([arrived("w1", 655, 5, now)], WINDOW, now);
    expect(ok.lateMinutes).toBe(0);
  });

  it("the lunch gap comes from the day window and the divider sits before the first afternoon row", () => {
    expect(lunchOf(WINDOW)).toEqual({ startMin: 780, endMin: 825 });
    expect(lunchOf({ ...WINDOW, intervals: [[600, 1140]] })).toBeNull();
    const m = buildDoctorModel(
      [appt("a", 620), appt("b", 700), appt("c", 840), appt("d", 870)],
      WINDOW,
      now,
    );
    expect(m.lunchAt).toBe(2);
    const none = buildDoctorModel([appt("a", 620)], { ...WINDOW, intervals: [[600, 1140]] }, now);
    expect(none.lunchAt).toBeNull();
  });

  it("carries the last order change and the break", () => {
    const m = buildDoctorModel([], WINDOW, now, {
      lastOrderChange: { byName: "Priya", at: "2026-11-25T05:18:00.000Z" },
      currentBreak: {
        id: "b",
        startedAt: now.toISOString(),
        minutes: 10,
        label: "Break",
        version: 1,
      },
    });
    expect(m.lastOrderChange?.byName).toBe("Priya");
    expect(m.currentBreak?.minutes).toBe(10);
    expect(m.rows).toEqual([]);
  });
});

describe("row status (T2.4, T2.5)", () => {
  const base = { kind: "waiting", isNext: false, canReorder: true } as const;
  it("Start for waiting, late and not arrived; Back for stepped out; nothing for done", () => {
    expect(rowAction({ ...base, isNext: true })).toEqual({ label: "Start", primary: true });
    expect(rowAction({ ...base, kind: "late" })).toEqual({ label: "Start", primary: false });
    expect(rowAction({ ...base, kind: "not_arrived" })?.label).toBe("Start");
    expect(rowAction({ ...base, kind: "stepped_out" })).toEqual({ label: "Back", primary: false });
    expect(rowAction({ ...base, kind: "done", canReorder: false })).toBeNull();
  });
  it("every kind has a pill colour; only waiting and done have a dot", () => {
    for (const k of ["waiting", "not_arrived", "stepped_out", "late", "done"] as const) {
      expect(PILL_CLASS[k]).toMatch(/^td-pill-/);
    }
    expect(pillHasDot("waiting")).toBe(true);
    expect(pillHasDot("late")).toBe(false);
  });
  it("the accessible name has name, time, status and next", () => {
    const m = buildDoctorModel([arrived("w1", 660, 12, at(660))], WINDOW, at(660));
    expect(rowLabel(m.rows[0]!)).toBe("Patient w1, 11:00 AM, waiting 12 min, next");
  });
});
