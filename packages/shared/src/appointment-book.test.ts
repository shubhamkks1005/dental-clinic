import { describe, expect, it } from "vitest";
import { parseBookAppointment } from "./appointment-book";

describe("book appointment body (2.3.4)", () => {
  it("accepts a phone booking and defaults priority to normal", () => {
    expect(
      parseBookAppointment({
        patientId: "p1",
        visitTypeId: "v1",
        dateLocal: "2026-11-23",
        startMin: 600,
        source: "phone",
      }),
    ).toEqual({
      ok: true,
      value: {
        patientId: "p1",
        visitTypeId: "v1",
        dateLocal: "2026-11-23",
        startMin: 600,
        source: "phone",
        priority: "normal",
        complaint: null,
        overrideReason: null,
      },
    });
  });

  it("refuses a missing patient or bad start", () => {
    expect(parseBookAppointment({ visitTypeId: "v1" }).ok).toBe(false);
    expect(
      parseBookAppointment({
        patientId: "p1",
        visitTypeId: "v1",
        dateLocal: "2026-11-23",
        startMin: 2000,
        source: "phone",
      }).ok,
    ).toBe(false);
  });

  it("accepts an empty or missing note (Q0.4: the dialog used to send null)", () => {
    const base = {
      patientId: "p1",
      visitTypeId: "v1",
      dateLocal: "2026-11-24",
      startMin: 675,
      source: "phone",
    };
    for (const complaint of [undefined, "", "   "]) {
      const r = parseBookAppointment({ ...base, complaint });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.value.complaint).toBeNull();
    }
  });
});
