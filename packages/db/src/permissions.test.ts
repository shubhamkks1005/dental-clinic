import { ROLES } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import type { Ctx } from "./context";
import { ForbiddenError } from "./errors";
import { assertAllowed, isAllowed, PERMISSIONS, permissionsFor } from "./permissions";

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

// 1.3.4: the full table per role, exactly as in docs/AUTH_PLAN.md 4f (doctor to confirm).
describe("permission table per role (1.3.4)", () => {
  it("doctor can do everything", () => {
    expect(permissionsFor("doctor")).toEqual(Object.keys(PERMISSIONS));
  });

  it("receptionist: patients, appointments, bills, documents, prints, today's summary; nothing clinical", () => {
    expect(permissionsFor("receptionist")).toEqual([
      "patients.view",
      "patients.edit",
      "clinical.alert_flag",
      "prescriptions.print",
      "certificates.print",
      "appointments.manage",
      "bills.create",
      "files.documents",
      "reports.today",
      "settings.read",
      "requests.view",
    ]);
  });

  it("receptionist cannot open clinical notes, delete patients, adjust bills or manage staff", () => {
    for (const action of [
      "clinical.view",
      "clinical.edit",
      "patients.delete",
      "bills.adjust",
      "staff.manage",
      "audit.view",
      "files.clinical",
      "reports.full",
    ] as const) {
      expect(isAllowed("receptionist", action)).toBe(false);
    }
  });

  it("developer (support) has configuration only, never patient data", () => {
    expect(permissionsFor("developer")).toEqual([
      "settings.read",
      "settings.write",
      "settings.medicines",
      "settings.billing",
    ]);
  });
});
