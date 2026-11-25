import type { ChartCell, ChartCondition } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import { isPatientRight, padButtons } from "./pad-model";

const cond = (appliesTo: ChartCondition["appliesTo"]): ChartCondition => ({
  code: "deep",
  label: "Deep cavity",
  color: "#BA1A1A",
  icon: "DC",
  appliesTo,
});
const cell = (surface: ChartCell["surface"]): ChartCell => ({
  toothFdi: 36,
  surface,
  conditionCode: "deep",
  notedAt: "",
  eventId: "e",
});
const ids = (b: ReturnType<typeof padButtons>) => b.map((x) => `${x.id}:${x.label}`).join(" ");

describe("marking pad", () => {
  it("D is on the left for the patient's right side, M for the left side", () => {
    expect(isPatientRight(16)).toBe(true);
    expect(isPatientRight(46)).toBe(true);
    expect(isPatientRight(54)).toBe(true);
    expect(isPatientRight(36)).toBe(false);
    expect(ids(padButtons(16, [], cond("both"), false, (c) => c))).toBe(
      "B:B left:D O:O right:M L:L W:Whole tooth",
    );
    expect(ids(padButtons(36, [], cond("both"), false, (c) => c))).toBe(
      "B:B left:M O:O right:D L:L W:Whole tooth",
    );
  });

  it("shows the condition already on a surface", () => {
    const b = padButtons(36, [cell("o")], cond("both"), false, () => "DC");
    expect(b.find((x) => x.id === "O")).toMatchObject({ sub: "DC", code: "deep" });
    expect(b.find((x) => x.id === "B")).toMatchObject({ sub: "·", code: null });
  });

  it("a surface-only condition switches off Whole tooth and the other way round; read-only switches all off", () => {
    expect(padButtons(36, [], cond("surface"), false, (c) => c).map((x) => x.disabled)).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
    expect(padButtons(36, [], cond("whole"), false, (c) => c).map((x) => x.disabled)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
    ]);
    expect(padButtons(36, [], cond("both"), true, (c) => c).every((x) => x.disabled)).toBe(true);
    expect(padButtons(36, [], undefined, false, (c) => c).every((x) => x.disabled)).toBe(true);
  });
});
