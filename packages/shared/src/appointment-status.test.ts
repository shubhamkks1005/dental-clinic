import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  isAllowedStatusTransition,
  NO_SHOW_AFTER_MINUTES,
  statusActionTargets,
  statusTransitionBlockReason,
  STATUS_UNDO_HOURS,
} from "./appointment-status";

const start = new Date("2026-11-23T04:30:00.000Z"); // 10:00 IST
const changed = new Date("2026-11-23T05:00:00.000Z");

describe("appointment status wheel (2.3.6)", () => {
  it("lists only the planned next statuses from each state", () => {
    expect(allowedNextStatuses("scheduled")).toEqual([
      "confirmed",
      "arrived",
      "in_chair",
      "cancelled",
      "no_show",
      "rescheduled",
    ]);
    expect(allowedNextStatuses("arrived")).toEqual(["in_chair", "cancelled"]);
    expect(allowedNextStatuses("in_chair")).toEqual(["completed"]);
    expect(allowedNextStatuses("completed")).toEqual([]);
    expect(isAllowedStatusTransition("scheduled", "completed")).toBe(false);
    expect(isAllowedStatusTransition("arrived", "in_chair")).toBe(true);
    // The doctor opens the visit before the desk pressed Arrived: never block the doctor.
    expect(isAllowedStatusTransition("scheduled", "in_chair")).toBe(true);
    expect(isAllowedStatusTransition("confirmed", "in_chair")).toBe(true);
    expect(isAllowedStatusTransition("cancelled", "in_chair")).toBe(false);
  });

  it("blocks no_show until start + 15 minutes", () => {
    const tooSoon = new Date(start.getTime() + (NO_SHOW_AFTER_MINUTES - 1) * 60 * 1000);
    expect(
      statusTransitionBlockReason("scheduled", "no_show", {
        startAt: start,
        statusChangedAt: changed,
        now: tooSoon,
      }),
    ).toMatch(/15 minutes/);
    const ok = new Date(start.getTime() + NO_SHOW_AFTER_MINUTES * 60 * 1000);
    expect(
      statusTransitionBlockReason("scheduled", "no_show", {
        startAt: start,
        statusChangedAt: changed,
        now: ok,
      }),
    ).toBeNull();
  });

  it("blocks undo to scheduled after 24 hours", () => {
    const late = new Date(changed.getTime() + (STATUS_UNDO_HOURS + 1) * 60 * 60 * 1000);
    expect(
      statusTransitionBlockReason("cancelled", "scheduled", {
        startAt: start,
        statusChangedAt: changed,
        now: late,
      }),
    ).toMatch(/24 hours/);
  });

  it("UI targets omit gated statuses", () => {
    const beforeNoShow = new Date(start.getTime());
    expect(
      statusActionTargets("scheduled", {
        startAt: start,
        statusChangedAt: changed,
        now: beforeNoShow,
      }),
    ).not.toContain("no_show");
  });
});
