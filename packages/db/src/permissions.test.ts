import { ROLES } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import type { Ctx } from "./context";
import { ForbiddenError } from "./errors";
import { assertAllowed, isAllowed, PERMISSIONS } from "./permissions";

const ctx = (role: Ctx["role"]): Ctx => ({ userId: "u", role, requestId: "r" });

describe("permission table (1.2.6)", () => {
  it("every action names at least one known role", () => {
    for (const roles of Object.values(PERMISSIONS)) {
      expect(roles.length).toBeGreaterThan(0);
      for (const role of roles) expect(ROLES).toContain(role);
    }
  });

  it("only doctor and developer may change settings", () => {
    expect(ROLES.filter((r) => isAllowed(r, "settings.write"))).toEqual(["doctor", "developer"]);
  });

  it("assertAllowed throws a ForbiddenError for a role not in the table", () => {
    expect(() => assertAllowed(ctx("receptionist"), "settings.write")).toThrow(ForbiddenError);
    expect(() => assertAllowed(ctx("doctor"), "settings.write")).not.toThrow();
  });
});
