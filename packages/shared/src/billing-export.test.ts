import { describe, expect, it } from "vitest";
import { billingExportToCsv, parseMonthParam } from "./billing-export";

describe("billingExportToCsv (5.3.12)", () => {
  it("writes header and one fake row without patient names", () => {
    const csv = billingExportToCsv([
      {
        date: "2026-11-01",
        billNumber: "SB-26-000001",
        patientCode: "P-000901",
        procedureGroup: "Scaling",
        taxCategory: "exempt",
        amountPaise: 150_000,
        discountPaise: 0,
        taxPaise: 0,
        modes: "cash:100000;upi:50000",
      },
    ]);
    expect(csv.startsWith("date,bill_number,patient_code")).toBe(true);
    expect(csv).toContain("P-000901");
    expect(csv).not.toContain("Fake");
    expect(csv).toContain("Scaling");
  });
});

describe("parseMonthParam", () => {
  it("accepts YYYY-MM", () => {
    expect(parseMonthParam("2026-11")).toEqual({ ok: true, month: "2026-11" });
    expect(parseMonthParam("2026-13").ok).toBe(false);
  });
});
