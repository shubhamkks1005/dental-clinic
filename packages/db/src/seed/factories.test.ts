import { describe, expect, it } from "vitest";
import { fakeHistory, fakeMobile, fakePatient, fakePersonName } from "./factories";

describe("fake data factories (1.7.5)", () => {
  it("builds a patient in the fake mobile and code ranges", () => {
    const p = fakePatient(3);
    expect(p.code).toBe("P-000004");
    expect(p.mobile).toMatch(/^90000\d{5}$/);
    expect(fakeMobile(3)).toBe(p.mobile);
  });

  it("person name and history are stable for a seed and marked fake where clinical", () => {
    expect(fakePersonName(0, 9)).toEqual(fakePersonName(0, 9));
    const h = fakeHistory(2);
    expect(h.allergies[0]).toMatch(/fake|None/i);
    expect(h.conditions[0]).toMatch(/fake|None/i);
    expect(h.notes).toMatch(/fake/i);
  });
});
