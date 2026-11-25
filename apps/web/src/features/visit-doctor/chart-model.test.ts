import type { ChartCell } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import { affectedTeeth, chartBadge, chartSaveText, withMarks } from "./chart-model";

const cell = (
  toothFdi: number,
  surface: ChartCell["surface"],
  conditionCode: string,
): ChartCell => ({
  toothFdi,
  surface,
  conditionCode,
  notedAt: "2026-11-01T00:00:00.000Z",
  eventId: `e${toothFdi}${surface}`,
});
const label = (c: string) => ({ deep: "Deep cavity", fill: "Filling" })[c as "deep" | "fill"] ?? c;

describe("chart rules", () => {
  it("a pending mark replaces the saved one on its surface and keeps the order", () => {
    const out = withMarks(
      [cell(24, "o", "deep"), cell(36, "o", "deep")],
      [
        { toothFdi: 36, surface: "o", conditionCode: "fill" },
        { toothFdi: 11, surface: "m", conditionCode: "deep" },
      ],
    );
    expect(out.map((c) => `${c.toothFdi}${c.surface}:${c.conditionCode}`)).toEqual([
      "11m:deep",
      "24o:deep",
      "36o:fill",
    ]);
    expect(out[0]?.changedToday).toBe(true);
  });

  it("groups findings by tooth and writes the badge with list words", () => {
    const list = affectedTeeth(
      [cell(36, "o", "deep"), cell(36, "d", "deep"), cell(24, "o", "fill")],
      label,
    );
    expect(list.map((t) => t.fdi)).toEqual([24, 36]);
    expect(chartBadge(list)).toBe("24 Filling · 36 Deep cavity");
    expect(chartBadge([])).toBe("");
    const many = affectedTeeth(
      [11, 12, 13, 14].map((t) => cell(t, "o", "deep")),
      label,
    );
    expect(chartBadge(many)).toBe("11 Deep cavity · 12 Deep cavity · 13 Deep cavity · +1");
  });

  it("save words", () => {
    expect(chartSaveText("pending", null)).toBe("Unsaved changes");
    expect(chartSaveText("saving", null)).toBe("Saving…");
    expect(chartSaveText("saved", null)).toBe("Saved");
    expect(chartSaveText("saved", new Date("2026-11-25T05:12:00.000Z"))).toMatch(/^Saved \d/);
  });
});
