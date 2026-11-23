import { describe, expect, it } from "vitest";
import { formatDate } from "../../ui/format";
import { bookedMessage } from "./booked-message";

describe("bookedMessage", () => {
  it("says the date and the time with AM or PM", () => {
    // The year shows only when it is not this year, so build the expectation the same way.
    expect(bookedMessage("2026-11-25", 10 * 60 + 30)).toBe(
      `Booked for ${formatDate("2026-11-25")}, 10:30 AM`,
    );
    expect(bookedMessage("2026-12-02", 17 * 60)).toBe(
      `Booked for ${formatDate("2026-12-02")}, 5:00 PM`,
    );
    expect(bookedMessage("2026-11-25", 600)).toMatch(/^Booked for Wed 25 Nov( 2026)?, 10:00 AM$/);
  });
});
