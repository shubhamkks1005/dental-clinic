import { describe, expect, it } from "vitest";
import {
  arrivalText,
  blankLine,
  itemsForSave,
  linesProblem,
  missingProcedures,
  subtotalPaise,
  type Line,
} from "./invoice-model";

const line = (over: Partial<Line>): Line => ({ ...blankLine("RCT", 120_000), ...over });

describe("invoice model (visit finished)", () => {
  it("adds up typed rupees in paise and says what blocks Save", () => {
    const lines = [
      line({ rupees: "1200", qty: 1 }),
      line({ label: "X-ray", rupees: "250", qty: 2 }),
    ];
    expect(subtotalPaise(lines)).toBe(170_000);
    expect(linesProblem(lines)).toBeNull();
    expect(linesProblem([])).toBe("An invoice needs at least one line.");
    expect(linesProblem([blankLine()])).toBe("Custom item has no amount.");
    expect(itemsForSave([line({ qty: 0, rupees: "99.5" })])[0]).toMatchObject({
      qty: 1,
      unitPaise: 9950,
    });
  });

  it("finds procedures done today that are not on the invoice", () => {
    const procs = [
      { id: "p1", label: "Root canal", toothFdi: 46, surfaces: [] },
      { id: "p2", label: "Composite restoration", toothFdi: 36, surfaces: [] },
    ];
    const lines = [line({ visitProcedureId: "p1", label: "Root canal" })];
    expect(missingProcedures(procs, lines, new Set()).map((m) => m.id)).toEqual(["p2"]);
    expect(missingProcedures(procs, lines, new Set(["p2"]))).toEqual([]);
    const typed = [...lines, line({ label: "Composite restoration (O)", toothFdi: 36 })];
    expect(missingProcedures(procs, typed, new Set())).toEqual([]);
  });

  it("says what the arrival money was for, else the mode", () => {
    const text = arrivalText([
      {
        paymentId: "a",
        amountPaise: 50_000,
        unallocatedPaise: 50_000,
        mode: "cash",
        reference: "",
        notes: "For: Consultation",
        receivedAt: "2026-11-27T04:35:00.000Z",
        receivedByName: "Priya",
      },
      {
        paymentId: "b",
        amountPaise: 50_000,
        unallocatedPaise: 50_000,
        mode: "upi",
        reference: "",
        notes: "",
        receivedAt: "2026-11-27T04:36:00.000Z",
        receivedByName: "Priya",
      },
    ]);
    expect(text).toBe("Consultation ₹500 · UPI ₹500 · 10:06 am · Priya");
  });
});
