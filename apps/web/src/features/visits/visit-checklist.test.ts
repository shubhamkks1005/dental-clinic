import { describe, expect, it } from "vitest";
import { visitChecklist } from "./visit-checklist";

const visit = (d: number, p: number) =>
  ({ diagnoses: new Array(d).fill({}), procedures: new Array(p).fill({}) }) as never;

describe("visitChecklist", () => {
  it("all ok when diagnosis, procedures and an issued prescription exist", () => {
    const items = visitChecklist(visit(1, 2), "issued");
    expect(items.map((i) => i.state)).toEqual(["ok", "ok", "ok"]);
    expect(items[1]!.label).toBe("Procedures (2)");
  });
  it("warns about an empty visit and a draft prescription", () => {
    const items = visitChecklist(visit(0, 0), "draft");
    expect(items.map((i) => i.state)).toEqual(["warn", "warn", "warn"]);
  });
  it("no prescription is neutral, not a warning", () => {
    expect(visitChecklist(visit(1, 1), "none")[2]!.state).toBe("neutral");
  });
});
