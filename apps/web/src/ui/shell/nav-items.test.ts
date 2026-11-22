import { describe, expect, it } from "vitest";
import { MAIN_NAV, moreItems, PHONE_TABS, visibleNav } from "./nav-items";

// Permission lists as /me returns them (packages/db permissions table, 1.3.4).
const RECEPTIONIST = [
  "patients.view",
  "patients.edit",
  "clinical.alert_flag",
  "prescriptions.print",
  "appointments.manage",
  "bills.create",
  "files.documents",
  "reports.today",
  "settings.read",
];
const DEVELOPER = ["settings.read", "settings.write"];

const labels = (items: { label: string }[]) => items.map((i) => i.label);

describe("menu per role (1.3.7)", () => {
  it("receptionist sees all seven main items (Settings shows only what she may view)", () => {
    expect(labels(visibleNav(MAIN_NAV, RECEPTIONIST))).toHaveLength(7);
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
