import { istLocalToUtc, orderDayQueue } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import type { DayAppointment } from "../../appointments/api";
import { applyMove } from "./queue-optimistic";

const DAY = "2026-11-25";
const NOW = new Date("2026-11-25T05:00:00.000Z");
const appt = (
  id: string,
  startMin: number,
  over: Partial<DayAppointment> = {},
): DayAppointment => ({
  id,
  patientId: `p-${id}`,
  patientCode: "P-000001",
  patientName: id,
  patientMobile: null,
  visitTypeId: "vt",
  visitTypeLabel: "Consultation",
  startAt: istLocalToUtc(DAY, startMin).toISOString(),
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
  updatedAt: istLocalToUtc(DAY, startMin).toISOString(),
  version: 1,
  ...over,
});
const order = (rows: DayAppointment[]) =>
  orderDayQueue(rows.map((r) => ({ ...r, queueOrder: r.queueOrder ?? null }))).map((r) => r.id);
const rows = () => [
  appt("a", 600, { status: "arrived", arrivedAt: NOW.toISOString() }),
  appt("b", 630),
  appt("c", 660),
  appt("done", 540, { status: "completed" }),
];

describe("optimistic queue moves (T2.5): the same order the server saves", () => {
  it("skip swaps with the next open row and marks Stepped out", () => {
    const out = applyMove(rows(), "skip", "a", NOW);
    expect(order(out)).toEqual(["b", "a", "c", "done"]);
    expect(out.find((r) => r.id === "a")).toMatchObject({
      skipCount: 1,
      steppedOutAt: NOW.toISOString(),
    });
  });

  it("skip on the last open row only marks Stepped out (no swap, never into a done row)", () => {
    const out = applyMove(rows(), "skip", "c", NOW);
    expect(order(out)).toEqual(["a", "b", "c", "done"]);
    expect(out.find((r) => r.id === "c")?.steppedOutAt).toBe(NOW.toISOString());
  });

  it("pull forward swaps with the row above; the first row does not move", () => {
    expect(order(applyMove(rows(), "pull-forward", "c", NOW))).toEqual(["a", "c", "b", "done"]);
    expect(order(applyMove(rows(), "pull-forward", "a", NOW))).toEqual(["a", "b", "c", "done"]);
  });

  it("late puts the row at the back, above done, and clears Stepped out", () => {
    const out = applyMove(rows(), "late", "a", NOW);
    expect(order(out)).toEqual(["b", "c", "a", "done"]);
    expect(out.find((r) => r.id === "a")).toMatchObject({
      lateAt: NOW.toISOString(),
      steppedOutAt: null,
    });
  });

  it("step back clears Stepped out and turns Not arrived into Arrived", () => {
    const skipped = applyMove(rows(), "skip", "b", NOW);
    const back = applyMove(skipped, "step-back", "b", NOW);
    expect(back.find((r) => r.id === "b")).toMatchObject({ steppedOutAt: null, status: "arrived" });
  });

  it("a second move builds on the numbers of the first (no jump on reload)", () => {
    const once = applyMove(rows(), "skip", "a", NOW);
    const twice = applyMove(once, "pull-forward", "c", NOW);
    expect(order(twice)).toEqual(["b", "c", "a", "done"]);
  });

  it("an unknown id changes nothing", () => {
    expect(order(applyMove(rows(), "skip", "nope", NOW))).toEqual(order(rows()));
  });
});
