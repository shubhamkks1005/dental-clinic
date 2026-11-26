import { describe, expect, it } from "vitest";
import {
  APPOINTMENT_BUSY_STATUSES,
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_SOURCES,
  APPOINTMENT_STATUSES,
  appointmentHoldsChair,
  chairForDoctor,
  DEFAULT_CHAIR_ID,
} from "./appointments";

describe("appointment enums (2.3.1)", () => {
  it("lists the status, source and priority values used in the schema", () => {
    expect([...APPOINTMENT_STATUSES]).toEqual([
      "scheduled",
      "confirmed",
      "arrived",
      "in_chair",
      "completed",
      "cancelled",
      "no_show",
      "rescheduled",
    ]);
    expect([...APPOINTMENT_SOURCES]).toEqual(["phone", "walk_in", "referral", "other"]);
    expect([...APPOINTMENT_PRIORITIES]).toEqual(["normal", "emergency"]);
    expect(DEFAULT_CHAIR_ID).toBe("1");
    expect([...APPOINTMENT_BUSY_STATUSES]).toEqual([
      "scheduled",
      "confirmed",
      "arrived",
      "in_chair",
    ]);
    expect(appointmentHoldsChair("scheduled")).toBe(true);
    expect(appointmentHoldsChair("cancelled")).toBe(false);
  });
});

describe("chairForDoctor (owner 2026-11-26: each doctor has their own chair)", () => {
  it("gives each doctor a distinct chair id, never the old shared one", () => {
    expect(chairForDoctor("u1")).toBe("doc:u1");
    expect(chairForDoctor("u1")).not.toBe(chairForDoctor("u2"));
    expect(chairForDoctor("u1")).not.toBe(DEFAULT_CHAIR_ID);
  });
});
