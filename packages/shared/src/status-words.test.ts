import { describe, expect, it } from "vitest";
import { billStatusKey, statusWord } from "./status-words";

describe("one status vocabulary", () => {
  it("uses the words from the design for appointments", () => {
    const words = ["scheduled", "confirmed", "arrived", "in_chair", "completed", "no_show"].map(
      (s) => statusWord("appointment", s).label,
    );
    expect(words).toEqual(["Booked", "Booked", "Waiting", "In chair", "Done", "Missed"]);
  });

  it("draft and booked are neutral, never green", () => {
    expect(statusWord("visit", "draft").tone).toBe("upcoming");
    expect(statusWord("appointment", "scheduled").tone).toBe("upcoming");
    expect(statusWord("visit", "final").tone).toBe("done");
  });

  it("cancelled is struck through", () => {
    expect(statusWord("bill", "cancelled").struck).toBe(true);
    expect(statusWord("appointment", "cancelled").struck).toBe(true);
  });

  it("never shows a raw code for an unknown value", () => {
    expect(statusWord("appointment", "in_the_future").label).toBe("In the future");
  });

  it("derives Open, Part paid and Paid from the paid amount", () => {
    expect(billStatusKey("issued", 150000, 0)).toBe("open");
    expect(billStatusKey("issued", 150000, 50000)).toBe("part_paid");
    expect(billStatusKey("issued", 150000, 150000)).toBe("paid");
    expect(billStatusKey("issued", 150000, 160000)).toBe("paid");
    expect(billStatusKey("draft", 150000, 0)).toBe("draft");
    expect(billStatusKey("cancelled", 150000, 150000)).toBe("cancelled");
  });
});
