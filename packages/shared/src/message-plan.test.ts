import { describe, expect, it } from "vitest";
import { DEFAULT_MESSAGING_SETTINGS } from "./messaging";
import { planMessages, respectQuietHours } from "./message-plan";
import { istLocalToUtc } from "./time";

const settings = { ...DEFAULT_MESSAGING_SETTINGS };

describe("message planner (7.2.4 / 7.9.1)", () => {
  it("skips patients without sms_reminders consent", () => {
    const start = istLocalToUtc("2026-11-25", 10 * 60 + 30);
    const planned = planMessages({
      appointments: [
        {
          id: "a1",
          patientId: "p1",
          dateLocal: "2026-11-25",
          startMin: 630,
          status: "scheduled",
          startAt: start.toISOString(),
        },
      ],
      consents: [{ patientId: "p1", smsReminders: false }],
      settings,
      now: new Date("2026-11-23T10:00:00.000Z"),
    });
    expect(planned.every((m) => m.status === "skipped")).toBe(true);
    expect(planned[0]?.skipReason).toBe("no_sms_reminders_consent");
  });

  it("plans confirm + remind with consent and dedupe keys", () => {
    const start = istLocalToUtc("2026-11-25", 10 * 60 + 30);
    const planned = planMessages({
      appointments: [
        {
          id: "a1",
          patientId: "p1",
          dateLocal: "2026-11-25",
          startMin: 630,
          status: "scheduled",
          startAt: start.toISOString(),
        },
      ],
      consents: [{ patientId: "p1", smsReminders: true }],
      settings,
      now: new Date("2026-11-23T10:00:00.000Z"),
    });
    expect(planned.some((m) => m.kind === "confirm" && m.status === "queued")).toBe(true);
    expect(planned.some((m) => m.kind === "remind" && m.dedupeKey.includes("remind:a1"))).toBe(
      true,
    );
  });

  it("does not plan reminder when appointment is inside min lead", () => {
    const start = istLocalToUtc("2026-11-23", 12 * 60);
    const planned = planMessages({
      appointments: [
        {
          id: "a2",
          patientId: "p1",
          dateLocal: "2026-11-23",
          startMin: 720,
          status: "scheduled",
          startAt: start.toISOString(),
        },
      ],
      consents: [{ patientId: "p1", smsReminders: true }],
      settings,
      now: new Date(start.getTime() - 60 * 60_000),
    });
    expect(planned.filter((m) => m.kind === "remind")).toHaveLength(0);
  });

  it("bumps quiet-hour sends to morning", () => {
    const late = istLocalToUtc("2026-11-23", 22 * 60);
    const bumped = respectQuietHours(late, settings);
    expect(bumped.getTime()).toBeGreaterThan(late.getTime());
  });

  it("returns nothing when messaging disabled", () => {
    const planned = planMessages({
      appointments: [],
      consents: [],
      settings: { ...settings, enabled: false },
      now: new Date(),
    });
    expect(planned).toEqual([]);
  });
});
