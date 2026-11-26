import { describe, expect, it } from "vitest";
import { DOCTOR_COLOURS, doctorColour, doctorLeaveSchema, doctorShortName } from "./doctor";

describe("doctor helpers (owner 2026-11-26: several doctors)", () => {
  it("short name keeps the surname", () => {
    expect(doctorShortName("Dr. Arvind Mehta")).toBe("Dr. Mehta");
    expect(doctorShortName("dr Neha  Kapoor ")).toBe("Dr. Kapoor");
    expect(doctorShortName("Priya")).toBe("Dr. Priya");
    expect(doctorShortName("  ")).toBe("Doctor");
  });

  it("colours repeat after six doctors and start with the design's teal", () => {
    expect(doctorColour(0).fg).toBe("#054D61");
    expect(doctorColour(6)).toEqual(doctorColour(0));
    expect(new Set(DOCTOR_COLOURS.map((c) => c.fg)).size).toBe(6);
  });

  it("leave needs a doctor and a real date; note is optional", () => {
    expect(doctorLeaveSchema.safeParse({ doctorId: "d1", dateLocal: "2026-12-01" }).success).toBe(
      true,
    );
    expect(doctorLeaveSchema.safeParse({ doctorId: "", dateLocal: "2026-12-01" }).success).toBe(
      false,
    );
    expect(doctorLeaveSchema.safeParse({ doctorId: "d1", dateLocal: "1 Dec" }).success).toBe(false);
    expect(
      doctorLeaveSchema.safeParse({
        doctorId: "d1",
        dateLocal: "2026-12-01",
        note: "x".repeat(101),
      }).success,
    ).toBe(false);
  });
});
