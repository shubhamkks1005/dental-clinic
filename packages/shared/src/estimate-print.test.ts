import { describe, expect, it } from "vitest";
import { ESTIMATE_DISCLAIMER, estimatePlanVersion, estimateValidUntil } from "./estimate-print";

describe("estimate print helpers (4.4.1)", () => {
  it("disclaimer is marked DRAFT for lawyer", () => {
    expect(ESTIMATE_DISCLAIMER).toContain("DRAFT - lawyer to confirm");
    expect(ESTIMATE_DISCLAIMER.toLowerCase()).toContain("estimate only");
  });

  it("valid-until is today plus 30 IST days", () => {
    // 23 Nov 2026 IST midday → 23 Dec 2026
    expect(estimateValidUntil(new Date("2026-11-23T06:30:00Z"))).toBe("2026-12-23");
  });

  it("plan version changes when estimate or version changes", () => {
    const a = estimatePlanVersion([{ version: 1, estimatePaise: 10000 }]);
    const b = estimatePlanVersion([{ version: 2, estimatePaise: 10000 }]);
    const c = estimatePlanVersion([{ version: 1, estimatePaise: 20000 }]);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});
