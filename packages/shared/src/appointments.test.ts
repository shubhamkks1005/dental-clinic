import { describe, expect, it } from "vitest";
import {
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_SOURCES,
  APPOINTMENT_STATUSES,
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
  });
});
