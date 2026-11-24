import { describe, expect, it } from "vitest";
import {
  canReorder,
  orderDayQueue,
  QUEUE_STEP,
  slotAboveForPull,
  swapTargetForSkip,
  type DayQueueRow,
} from "./appointment-queue";

let n = 0;
function row(over: Partial<DayQueueRow> & { id: string }): DayQueueRow {
  n += 1;
  return {
    status: "scheduled",
    queueOrder: null,
    arrivedAt: null,
    startAt: `2026-11-25T0${n % 10}:00:00.000Z`,
    ...over,
  };
}
const ids = (rows: DayQueueRow[]) => rows.map((r) => r.id);

describe("orderDayQueue", () => {
  it("puts the chair row first, then queue order, then done", () => {
    const rows = [
      row({ id: "done", status: "completed" }),
      row({ id: "b", queueOrder: 20 }),
      row({ id: "chair", status: "in_chair" }),
      row({ id: "a", queueOrder: 10, status: "arrived" }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["chair", "a", "b", "done"]);
  });

  it("puts rows without a saved order after rows with one", () => {
    const rows = [
      row({ id: "free1", startAt: "2026-11-25T03:00:00.000Z" }),
      row({ id: "saved", queueOrder: 50, startAt: "2026-11-25T09:00:00.000Z" }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["saved", "free1"]);
  });

  it("with no saved order: arrived first by arrival time, then by start time", () => {
    const rows = [
      row({ id: "late-start", startAt: "2026-11-25T05:00:00.000Z" }),
      row({ id: "early-start", startAt: "2026-11-25T04:00:00.000Z" }),
      row({ id: "arr2", status: "arrived", arrivedAt: "2026-11-25T04:20:00.000Z" }),
      row({ id: "arr1", status: "arrived", arrivedAt: "2026-11-25T04:10:00.000Z" }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["arr1", "arr2", "early-start", "late-start"]);
  });

  it("an arrived emergency goes ahead of earlier arrivals when nothing is saved", () => {
    const rows = [
      row({ id: "w1", status: "arrived", arrivedAt: "2026-11-25T04:10:00.000Z" }),
      row({
        id: "em",
        status: "arrived",
        priority: "emergency",
        arrivedAt: "2026-11-25T04:30:00.000Z",
      }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["em", "w1"]);
  });

  it("leaves out cancelled, missed and moved rows", () => {
    const rows = [
      row({ id: "x1", status: "cancelled" }),
      row({ id: "x2", status: "no_show" }),
      row({ id: "x3", status: "rescheduled" }),
      row({ id: "ok" }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["ok"]);
  });

  it("keeps a stepped-out row where its queue order puts it", () => {
    const rows = [
      row({ id: "a", queueOrder: 10 }),
      row({ id: "out", queueOrder: 20 }),
      row({ id: "c", queueOrder: 30 }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["a", "out", "c"]);
  });

  it("a walk-in with a later saved order goes last among the active", () => {
    const rows = [
      row({ id: "a", queueOrder: 10 }),
      row({ id: "walk", queueOrder: 20, status: "arrived" }),
      row({ id: "b", queueOrder: 15 }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["a", "b", "walk"]);
  });

  it("breaks a tie in queue order by start time, then id", () => {
    const rows = [
      row({ id: "z", queueOrder: 10, startAt: "2026-11-25T04:00:00.000Z" }),
      row({ id: "y", queueOrder: 10, startAt: "2026-11-25T04:00:00.000Z" }),
      row({ id: "first", queueOrder: 10, startAt: "2026-11-25T03:00:00.000Z" }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["first", "y", "z"]);
  });

  it("does not change the input array", () => {
    const rows = [row({ id: "b", queueOrder: 2 }), row({ id: "a", queueOrder: 1 })];
    orderDayQueue(rows);
    expect(ids(rows)).toEqual(["b", "a"]);
  });

  it("returns an empty list for no rows and for only finished-out rows", () => {
    expect(orderDayQueue([])).toEqual([]);
    expect(orderDayQueue([row({ id: "x", status: "cancelled" })])).toEqual([]);
  });

  it("orders several done rows by start time at the bottom", () => {
    const rows = [
      row({ id: "d2", status: "completed", startAt: "2026-11-25T05:00:00.000Z" }),
      row({ id: "d1", status: "completed", startAt: "2026-11-25T04:00:00.000Z" }),
      row({ id: "a", queueOrder: 10 }),
    ];
    expect(ids(orderDayQueue(rows))).toEqual(["a", "d1", "d2"]);
  });
});

describe("swapTargetForSkip and slotAboveForPull", () => {
  const list = (): DayQueueRow[] =>
    orderDayQueue([
      row({ id: "chair", status: "in_chair" }),
      row({ id: "a", queueOrder: 10, status: "arrived" }),
      row({ id: "b", queueOrder: 20 }),
      row({ id: "done", status: "completed" }),
    ]);

  it("skip swaps with the next unfinished row, even one that has not arrived", () => {
    expect(swapTargetForSkip(list(), "a")?.id).toBe("b");
  });

  it("skip on the last unfinished row has no partner (only Stepped out)", () => {
    expect(swapTargetForSkip(list(), "b")).toBeNull();
  });

  it("skip on a lone row or an unknown id has no partner", () => {
    expect(swapTargetForSkip(orderDayQueue([row({ id: "solo" })]), "solo")).toBeNull();
    expect(swapTargetForSkip(list(), "nope")).toBeNull();
  });

  it("pull forward swaps with the active row above, never the chair", () => {
    expect(slotAboveForPull(list(), "b")?.id).toBe("a");
    expect(slotAboveForPull(list(), "a")).toBeNull();
  });

  it("pull forward on a lone row or an unknown id has no slot", () => {
    expect(slotAboveForPull(orderDayQueue([row({ id: "solo" })]), "solo")).toBeNull();
    expect(slotAboveForPull(list(), "nope")).toBeNull();
  });

  it("only scheduled, confirmed and arrived rows can be reordered", () => {
    for (const s of ["scheduled", "confirmed", "arrived"] as const)
      expect(canReorder(s)).toBe(true);
    for (const s of ["in_chair", "completed", "cancelled", "no_show", "rescheduled"] as const) {
      expect(canReorder(s)).toBe(false);
    }
    expect(QUEUE_STEP).toBe(10);
  });
});
