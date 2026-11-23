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

  const apptAt = (id: string, dateLocal: string, startMin: number) => ({
    id,
    patientId: "p1",
    dateLocal,
    startMin,
    status: "scheduled",
    startAt: istLocalToUtc(dateLocal, startMin).toISOString(),
  });

  it("Q1.5: no confirm or reminder for an appointment that already started", () => {
    const planned = planMessages({
      appointments: [apptAt("past", "2026-11-23", 9 * 60)],
      consents: [{ patientId: "p1", smsReminders: true }],
      settings,
      now: new Date("2026-11-23T08:00:00.000Z"), // 13:30 IST
    });
    expect(planned).toEqual([]);
  });

  it("Q1.5: a patient with no usable number gets skipped rows, never queued ones", () => {
    const planned = planMessages({
      appointments: [apptAt("a9", "2026-11-25", 10 * 60)],
      consents: [{ patientId: "p1", smsReminders: true }],
      settings,
      now: new Date("2026-11-23T10:00:00.000Z"),
      noNumber: new Set(["p1"]),
    });
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((m) => m.status === "skipped" && m.skipReason === "no_number")).toBe(true);
  });

  it("Q1.5: the day-before reminder is due at 17:00 IST the day before", () => {
    const planned = planMessages({
      appointments: [apptAt("a8", "2026-11-25", 10 * 60)],
      consents: [{ patientId: "p1", smsReminders: true }],
      settings,
      now: new Date("2026-11-23T10:00:00.000Z"),
    });
    const remind = planned.find((m) => m.kind === "remind");
    expect(remind?.sendAfter).toBe(istLocalToUtc("2026-11-24", 17 * 60).toISOString());
  });

  it("Q1.5: a rescheduled booking gets no confirmation (the moved message covers it) but keeps its reminder", () => {
    const planned = planMessages({
      appointments: [{ ...apptAt("m1", "2026-11-25", 10 * 60), rescheduledFrom: "old" }],
      consents: [{ patientId: "p1", smsReminders: true }],
      settings,
      now: new Date("2026-11-23T10:00:00.000Z"),
    });
    expect(planned.some((m) => m.kind === "confirm")).toBe(false);
    expect(planned.some((m) => m.kind === "remind")).toBe(true);
  });
});
