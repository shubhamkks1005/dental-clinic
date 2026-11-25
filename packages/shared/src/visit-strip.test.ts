import { describe, expect, it } from "vitest";
import { courseDays, followUpStatus, historyAnswer, STRIP_CODES } from "./visit-strip";

describe("historyAnswer", () => {
  const items = [
    { code: "diabetes", answer: "no" as const },
    { code: "med_blood_thinner", answer: "unknown" as const },
    { code: "asthma", answer: "yes" as const },
  ];
  it("says yes, no or unknown, and never no for something not asked", () => {
    expect(historyAnswer(items, STRIP_CODES.diabetes)).toBe("no");
    expect(historyAnswer(items, STRIP_CODES.bloodThinner)).toBe("unknown");
    expect(historyAnswer([], STRIP_CODES.diabetes)).toBe("unknown");
    expect(historyAnswer(null, STRIP_CODES.diabetes)).toBe("unknown");
    expect(historyAnswer([{ code: "diabetes", answer: "yes" }], STRIP_CODES.diabetes)).toBe("yes");
  });
});

describe("courseDays", () => {
  it("reads the day count and ignores SOS or empty", () => {
    expect(courseDays("5")).toBe(5);
    expect(courseDays("7 days after food")).toBe(7);
    expect(courseDays("SOS")).toBeNull();
    expect(courseDays("")).toBeNull();
    expect(courseDays(null)).toBeNull();
    expect(courseDays("0")).toBeNull();
  });
});

describe("followUpStatus", () => {
  const base = { issuedOn: "2025-11-13", medicineDays: ["5", "3"], today: "2025-11-22" };
  it("is late with the days counted and the course end", () => {
    expect(followUpStatus({ ...base, followUpOn: "2025-11-18" })).toEqual({
      dueOn: "2025-11-18",
      daysLate: 4,
      medsFinishedOn: "2025-11-18",
      state: "late",
    });
  });
  it("is due today and upcoming", () => {
    expect(followUpStatus({ ...base, followUpOn: "2025-11-22" })?.state).toBe("due_today");
    expect(followUpStatus({ ...base, followUpOn: "2025-11-25" })).toMatchObject({
      state: "upcoming",
      daysLate: -3,
    });
  });
  it("has no course end when no medicine has a day count, and no status without a date", () => {
    expect(
      followUpStatus({ ...base, medicineDays: ["SOS"], followUpOn: "2025-11-18" })?.medsFinishedOn,
    ).toBeNull();
    expect(followUpStatus({ ...base, followUpOn: null })).toBeNull();
  });
  it("counts across a month end", () => {
    expect(
      followUpStatus({
        followUpOn: "2025-11-30",
        issuedOn: "2025-11-28",
        medicineDays: ["5"],
        today: "2025-12-02",
      }),
    ).toMatchObject({ daysLate: 2, medsFinishedOn: "2025-12-03" });
  });
});
