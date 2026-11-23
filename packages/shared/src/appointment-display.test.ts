import { describe, expect, it } from "vitest";
import { APPOINTMENT_STATUS_LABEL, appointmentStatusTone } from "./appointment-display";

describe("appointment display (2.4.1)", () => {
  it("every status has an English label", () => {
    expect(APPOINTMENT_STATUS_LABEL.scheduled).toBe("Booked");
    expect(APPOINTMENT_STATUS_LABEL.in_chair).toBe("In chair");
    expect(APPOINTMENT_STATUS_LABEL.no_show).toBe("Missed");
  });

  it("maps status to badge tone; emergency overrides upcoming", () => {
    expect(appointmentStatusTone("completed")).toBe("done");
    expect(appointmentStatusTone("in_chair")).toBe("in-room");
    expect(appointmentStatusTone("arrived")).toBe("waiting");
    expect(appointmentStatusTone("scheduled")).toBe("upcoming");
    expect(appointmentStatusTone("no_show")).toBe("emergency");
    expect(appointmentStatusTone("scheduled", "emergency")).toBe("emergency");
    expect(appointmentStatusTone("completed", "emergency")).toBe("done");
  });
});
