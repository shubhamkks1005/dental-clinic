import { describe, expect, it } from "vitest";
import { ageFromBirthInput } from "./age-from-birth";

describe("ageFromBirthInput", () => {
  it("turns a typed date of birth into whole years on the given day", () => {
    expect(ageFromBirthInput("10/05/1990", "2026-11-23")).toBe(36);
    expect(ageFromBirthInput("24/11/1990", "2026-11-23")).toBe(35);
  });

  it("is null while the date is incomplete, invalid, in the future or absurd", () => {
    expect(ageFromBirthInput("", "2026-11-23")).toBeNull();
    expect(ageFromBirthInput(undefined, "2026-11-23")).toBeNull();
    expect(ageFromBirthInput("10/05/19", "2026-11-23")).toBeNull();
    expect(ageFromBirthInput("31/02/1990", "2026-11-23")).toBeNull();
    expect(ageFromBirthInput("01/01/2030", "2026-11-23")).toBeNull();
    expect(ageFromBirthInput("01/01/1800", "2026-11-23")).toBeNull();
  });

  it("a baby under one year is 0", () => {
    expect(ageFromBirthInput("01/06/2026", "2026-11-23")).toBe(0);
  });
});
