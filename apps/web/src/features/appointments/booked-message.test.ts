import { describe, expect, it } from "vitest";
import { bookedMessage } from "./booked-message";

describe("bookedMessage", () => {
  it("says the date and the time with AM or PM", () => {
    expect(bookedMessage("2026-11-25", 10 * 60 + 30)).toBe("Booked for 25/11/2026, 10:30 AM");
    expect(bookedMessage("2026-12-02", 17 * 60)).toBe("Booked for 02/12/2026, 5:00 PM");
  });
});
