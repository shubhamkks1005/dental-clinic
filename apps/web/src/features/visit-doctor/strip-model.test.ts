import { describe, expect, it } from "vitest";
import { bpText, duesText, followUpText, shortDay } from "./strip-model";

const late = (daysLate: number, medsFinishedOn: string | null) => ({
  dueOn: "2026-11-18",
  daysLate,
  medsFinishedOn,
  state: "late" as const,
});

describe("strip words", () => {
  it("short day", () => {
    expect(shortDay("2026-11-18")).toBe("18 Nov");
    expect(shortDay("2026-01-05")).toBe("5 Jan");
  });

  it("follow-up: late, with meds finished only when the course is over", () => {
    expect(followUpText(late(4, "2026-11-20"), "2026-11-22")).toBe(
      "Follow-up: 4 days late (18 Nov due · meds finished)",
    );
    expect(followUpText(late(1, "2026-11-25"), "2026-11-19")).toBe(
      "Follow-up: 1 day late (18 Nov due)",
    );
    expect(followUpText(late(2, null), "2026-11-20")).toBe("Follow-up: 2 days late (18 Nov due)");
  });

  it("follow-up: today, coming, none", () => {
    expect(
      followUpText(
        { dueOn: "2026-11-25", daysLate: 0, medsFinishedOn: null, state: "due_today" },
        "2026-11-25",
      ),
    ).toBe("Follow-up: due today");
    expect(
      followUpText(
        { dueOn: "2026-12-02", daysLate: -7, medsFinishedOn: null, state: "upcoming" },
        "2026-11-25",
      ),
    ).toBe("Follow-up: due 2 Dec");
    expect(followUpText(null, "2026-11-25")).toBeNull();
  });

  it("dues and BP", () => {
    expect(duesText(150000)).toBe("Dues: ₹1,500 due");
    expect(duesText(0)).toBeNull();
    expect(bpText({ bpSystolic: 128, bpDiastolic: 82 })).toBe("BP: 128/82");
    expect(bpText({ bpSystolic: 128, bpDiastolic: null })).toBeNull();
  });
});
