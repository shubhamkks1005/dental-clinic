import { describe, expect, it } from "vitest";
import {
  normaliseEmail,
  parseGoogleReset,
  parseNewStaff,
  parseRoleChange,
  parseVersionOnly,
} from "./staff";

describe("staff input rules (1.3.6)", () => {
  it("normalises email: trims and lowercases", () => {
    expect(normaliseEmail("  Meena.Test@Example.COM ")).toBe("meena.test@example.com");
  });

  it("accepts a new receptionist and cleans the name and email", () => {
    expect(
      parseNewStaff({ name: "  Meena   Test ", email: " Meena@Example.com", role: "receptionist" }),
    ).toEqual({
      ok: true,
      value: { name: "Meena Test", email: "meena@example.com", role: "receptionist" },
    });
  });

  it("refuses missing or bad fields with a plain message", () => {
    expect(parseNewStaff({ name: "", email: "a@b.co", role: "doctor" })).toMatchObject({
      ok: false,
      message: "Enter the person's name.",
    });
    expect(parseNewStaff({ name: "A", email: "not-an-email", role: "doctor" }).ok).toBe(false);
    expect(
      parseNewStaff({ name: "A", email: "a@b.co'; DROP TABLE users;--", role: "doctor" }).ok,
    ).toBe(false);
    expect(parseNewStaff({ name: "A\u0007", email: "a@b.co", role: "doctor" }).ok).toBe(false);
    expect(parseNewStaff({ name: "x".repeat(81), email: "a@b.co", role: "doctor" }).ok).toBe(false);
    expect(parseNewStaff(null).ok).toBe(false);
  });

  it("the doctor can give only Doctor or Receptionist (never Developer)", () => {
    expect(parseNewStaff({ name: "A", email: "a@b.co", role: "developer" })).toMatchObject({
      ok: false,
      message: "Choose Doctor or Receptionist.",
    });
    expect(parseRoleChange({ role: "developer", version: 1 }).ok).toBe(false);
    expect(parseRoleChange({ role: "doctor", version: 3 })).toEqual({
      ok: true,
      value: { role: "doctor", version: 3 },
    });
  });

  it("every change carries the version the user saw", () => {
    expect(parseVersionOnly({ version: 2 })).toEqual({ ok: true, value: { version: 2 } });
    for (const version of [0, -1, 1.5, "2", undefined]) {
      expect(parseVersionOnly({ version }).ok).toBe(false);
    }
    expect(parseGoogleReset({ email: "New@Example.com", version: 4 })).toEqual({
      ok: true,
      value: { email: "new@example.com", version: 4 },
    });
  });
});
