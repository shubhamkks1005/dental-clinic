import { describe, expect, it } from "vitest";
import { expectedStarts, runningLateMinutes, type ExpectedRow } from "./expected-times";
import { istLocalToUtc } from "./time";

const DAY = "2026-11-25";
const at = (min: number) => istLocalToUtc(DAY, min);
const r = (id: string, startMin: number, over: Partial<ExpectedRow> = {}): ExpectedRow => ({
  id,
  status: "scheduled",
  startMin,
  endMin: startMin + 30,
  steppedOutAt: null,
  startedAt: null,
  ...over,
});

describe("expectedStarts", () => {
  it("empty chair: the cursor is now, never before the booked time", () => {
    const m = expectedStarts({ ordered: [r("a", 600), r("b", 630)], now: at(615) });
    expect(m.get("a")).toBe(615);
    expect(m.get("b")).toBe(645);
  });

  it("a row booked later than the cursor starts at its booked time", () => {
    expect(expectedStarts({ ordered: [r("a", 700)], now: at(600) }).get("a")).toBe(700);
  });

  it("busy chair: the cursor is the in-chair start plus its planned length", () => {
    const chair = r("c", 600, { status: "in_chair", startedAt: at(610).toISOString() });
    const m = expectedStarts({ ordered: [chair, r("a", 630)], now: at(620) });
    expect(m.has("c")).toBe(false);
    expect(m.get("a")).toBe(640);
  });

  it("busy chair that overran: the cursor is now", () => {
    const chair = r("c", 600, { status: "in_chair", startedAt: at(600).toISOString() });
    expect(expectedStarts({ ordered: [chair, r("a", 630)], now: at(650) }).get("a")).toBe(650);
  });

  it("a stepped-out row gets no time and does not push the others", () => {
    const m = expectedStarts({
      ordered: [r("a", 600), r("out", 630, { steppedOutAt: "x" }), r("b", 660)],
      now: at(600),
    });
    expect(m.has("out")).toBe(false);
    expect(m.get("b")).toBe(660);
  });

  it("done rows are skipped", () => {
    const m = expectedStarts({
      ordered: [r("d", 540, { status: "completed" }), r("a", 600)],
      now: at(590),
    });
    expect(m.has("d")).toBe(false);
    expect(m.get("a")).toBe(600);
  });

  it("chairFreeAtMin overrides the chair maths (a break is not an input at all)", () => {
    expect(
      expectedStarts({ ordered: [r("a", 600)], now: at(600), chairFreeAtMin: 640 }).get("a"),
    ).toBe(640);
  });
});

describe("runningLateMinutes", () => {
  const next = { id: "a", startMin: 600 };
  it("is 0 when the first patient is within the limit", () => {
    expect(runningLateMinutes({ next, expected: new Map([["a", 608]]) })).toBe(0);
    expect(runningLateMinutes({ next, expected: new Map([["a", 610]]) })).toBe(0);
  });
  it("is the delay when it is over the limit", () => {
    expect(runningLateMinutes({ next, expected: new Map([["a", 625]]) })).toBe(25);
  });
  it("uses a custom limit", () => {
    expect(runningLateMinutes({ next, expected: new Map([["a", 608]]), limitMinutes: 5 })).toBe(8);
  });
  it("is 0 without a Next patient or an expected time", () => {
    expect(runningLateMinutes({ next: null, expected: new Map() })).toBe(0);
    expect(runningLateMinutes({ next, expected: new Map() })).toBe(0);
  });
});
