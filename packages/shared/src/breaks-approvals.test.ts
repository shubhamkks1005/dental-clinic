import { describe, expect, it } from "vitest";
import {
  adjustBreakSchema,
  answerApprovalSchema,
  APPROVAL_TYPE_LABEL,
  APPROVAL_TYPES,
  BREAK_PRESETS,
  breakEndsAt,
  createApprovalSchema,
  startBreakSchema,
} from "./index";
import { SETTING_SCHEMAS } from "./settings";
import { TUNABLES, tunableDefault } from "./tunables";

describe("break schemas", () => {
  it("every preset is a valid break", () => {
    for (const p of BREAK_PRESETS) {
      expect(startBreakSchema.safeParse({ minutes: p.minutes, label: p.label }).success).toBe(true);
    }
  });
  it("refuses under 5, over 120, not a multiple of 5, or not a number", () => {
    for (const minutes of [0, 4, 7, 125, 5.5, "5", null]) {
      expect(startBreakSchema.safeParse({ minutes }).success).toBe(false);
    }
  });
  it("adjust takes plus or minus a multiple of 5 and a version", () => {
    expect(adjustBreakSchema.safeParse({ deltaMinutes: 5, version: 1 }).success).toBe(true);
    expect(adjustBreakSchema.safeParse({ deltaMinutes: -5, version: 2 }).success).toBe(true);
    expect(adjustBreakSchema.safeParse({ deltaMinutes: 0, version: 1 }).success).toBe(false);
    expect(adjustBreakSchema.safeParse({ deltaMinutes: 3, version: 1 }).success).toBe(false);
    expect(adjustBreakSchema.safeParse({ deltaMinutes: 5 }).success).toBe(false);
  });
  it("works out when a break ends", () => {
    const end = breakEndsAt({ startedAt: "2026-11-25T07:00:00.000Z", minutes: 15 });
    expect(end.toISOString()).toBe("2026-11-25T07:15:00.000Z");
  });
});

describe("approval schemas", () => {
  const ok = { type: "emergency_insert", appointmentId: "a1", note: "Pain, 3 PM" };
  it("accepts a request and defaults urgent to false", () => {
    expect(createApprovalSchema.parse(ok).urgent).toBe(false);
  });
  it("needs a note, a known type and one of patient, appointment or bill", () => {
    expect(createApprovalSchema.safeParse({ ...ok, note: "  " }).success).toBe(false);
    expect(createApprovalSchema.safeParse({ ...ok, note: "x".repeat(201) }).success).toBe(false);
    expect(createApprovalSchema.safeParse({ ...ok, type: "other" }).success).toBe(false);
    expect(createApprovalSchema.safeParse({ type: "refund", note: "x" }).success).toBe(false);
    expect(
      createApprovalSchema.safeParse({ type: "refund", note: "x", billId: "b1" }).success,
    ).toBe(true);
  });
  it("every type has a short English label", () => {
    for (const t of APPROVAL_TYPES) expect(APPROVAL_TYPE_LABEL[t].length).toBeGreaterThan(3);
  });
  it("an answer needs approve or reject and a version; the note is optional", () => {
    expect(answerApprovalSchema.safeParse({ decision: "approve", version: 1 }).success).toBe(true);
    expect(answerApprovalSchema.safeParse({ decision: "maybe", version: 1 }).success).toBe(false);
    expect(
      answerApprovalSchema.safeParse({ decision: "reject", note: "x".repeat(201), version: 1 })
        .success,
    ).toBe(false);
  });
});

describe("new tunables", () => {
  it("have defaults, bounds and a settings rule", () => {
    const keys = ["appointments.late_after_minutes", "today.running_late_after_minutes"] as const;
    for (const key of keys) {
      expect(tunableDefault(key)).toBe(10);
      expect(TUNABLES[key].min).toBe(1);
      expect(TUNABLES[key].max).toBe(120);
      expect(SETTING_SCHEMAS[key].safeParse(0).success).toBe(false);
      expect(SETTING_SCHEMAS[key].safeParse(15).success).toBe(true);
    }
  });
});
