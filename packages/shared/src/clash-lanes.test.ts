import { describe, expect, it } from "vitest";
import { clashLanes, type LaneInput } from "./clash-lanes";

const r = (id: string, startMin: number, endMin: number, busy = true): LaneInput => ({
  id,
  startMin,
  endMin,
  busy,
});

const short = (rows: LaneInput[]) =>
  clashLanes(rows).map((p) => `${p.id}:${p.lane}/${p.lanes}${p.behind ? "b" : ""}`);

describe("clashLanes (owner 2026-11-26: clashes shown side by side)", () => {
  it("one booking takes the full width", () => {
    expect(short([r("a", 600, 630)])).toEqual(["a:0/1"]);
  });

  it("two at once share two lanes; touching end-to-start does not clash", () => {
    expect(short([r("a", 600, 630), r("b", 600, 660)])).toEqual(["a:0/2", "b:1/2"]);
    expect(short([r("a", 600, 630), r("b", 630, 660)])).toEqual(["a:0/1", "b:0/1"]);
  });

  it("three overlapping share three lanes", () => {
    expect(short([r("a", 600, 660), r("b", 610, 640), r("c", 620, 650)])).toEqual([
      "a:0/3",
      "b:1/3",
      "c:2/3",
    ]);
  });

  it("chain A-B-C where A and C do not touch uses 2 lanes", () => {
    expect(short([r("a", 600, 630), r("b", 620, 660), r("c", 640, 670)])).toEqual([
      "a:0/2",
      "b:1/2",
      "c:0/2",
    ]);
  });

  it("a cancelled row under a busy one goes behind; alone it keeps its own place", () => {
    expect(short([r("a", 600, 630), r("x", 600, 630, false), r("y", 700, 730, false)])).toEqual([
      "a:0/1",
      "x:0/1b",
      "y:0/1",
    ]);
  });
});
