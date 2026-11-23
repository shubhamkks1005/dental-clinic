import { describe, expect, it } from "vitest";
import { MAIN_NAV, moreItems, PHONE_TABS, visibleNav } from "./nav-items";

// Permission lists as /me returns them (packages/db permissions table, 1.3.4).
const RECEPTIONIST = [
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
];
const DEVELOPER = ["settings.read", "settings.write"];

const labels = (items: { label: string }[]) => items.map((i) => i.label);

describe("menu per role (1.3.7)", () => {
  it("the sidebar has eight items; the receptionist sees seven (no Library)", () => {
    expect(MAIN_NAV).toHaveLength(8);
    expect(labels(visibleNav(MAIN_NAV, RECEPTIONIST))).toEqual([
      "Today",
      "Patients",
      "Appointments",
      "Billing",
      "Messages",
      "Reports",
      "Settings",
    ]);
  });

  it("the doctor sees Library between Reports and Settings", () => {
    const doctor = [...RECEPTIONIST, "settings.medicines"];
    expect(labels(visibleNav(MAIN_NAV, doctor)).slice(-3)).toEqual([
      "Reports",
      "Library",
      "Settings",
    ]);
    expect(labels(moreItems(doctor))).toEqual(["Messages", "Reports", "Library", "Settings"]);
  });

  it("developer (support) sees only Settings, and only More on the phone", () => {
    expect(labels(visibleNav(MAIN_NAV, DEVELOPER))).toEqual(["Settings"]);
    expect(labels(visibleNav(PHONE_TABS, DEVELOPER))).toEqual(["More"]);
  });

  it("the phone More screen lists the main items that have no tab", () => {
    expect(labels(moreItems(RECEPTIONIST))).toEqual(["Messages", "Reports", "Settings"]);
    expect(labels(moreItems(DEVELOPER))).toEqual(["Settings"]);
  });
});
