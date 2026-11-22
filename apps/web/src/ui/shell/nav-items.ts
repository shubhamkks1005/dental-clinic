import type { IconName } from "../icons";

// permission: the item shows only if the signed-in role has it (packages/db/src/permissions.ts).
export type NavItem = { to: string; label: string; icon: IconName; permission?: string };

// Laptop sidebar and tablet tabs (DESIGN.md: 7 items).
export const MAIN_NAV: NavItem[] = [
  { to: "/app", label: "Today", icon: "today", permission: "appointments.manage" },
  { to: "/app/patients", label: "Patients", icon: "patients", permission: "patients.view" },
  {
    to: "/app/appointments",
    label: "Appointments",
    icon: "calendar",
    permission: "appointments.manage",
  },
  { to: "/app/billing", label: "Billing", icon: "billing", permission: "bills.create" },
  // Reminders carry patient names, so the same permission as viewing patients.
  { to: "/app/messages", label: "Messages", icon: "messages", permission: "patients.view" },
  { to: "/app/reports", label: "Reports", icon: "reports", permission: "reports.today" },
  { to: "/app/settings", label: "Settings", icon: "settings", permission: "settings.read" },
];

// Phone bottom tab bar (DESIGN.md: 5 items). More lists the rest, Sign out included.
export const PHONE_TABS: NavItem[] = [
  { to: "/app", label: "Today", icon: "today", permission: "appointments.manage" },
  { to: "/app/patients", label: "Patients", icon: "patients", permission: "patients.view" },
  {
    to: "/app/appointments",
    label: "Calendar",
    icon: "calendar",
    permission: "appointments.manage",
  },
  { to: "/app/billing", label: "Billing", icon: "billing", permission: "bills.create" },
  { to: "/app/more", label: "More", icon: "more" },
];

export const NEW_PATIENT_PATH = "/app/patients/new";
export const NEW_PATIENT_PERMISSION = "patients.edit";

export function visibleNav(items: NavItem[], permissions: readonly string[]): NavItem[] {
  return items.filter((item) => !item.permission || permissions.includes(item.permission));
}

// Main items that have no phone tab: these are listed on the phone More screen.
export function moreItems(permissions: readonly string[]): NavItem[] {
  const tabs = new Set(PHONE_TABS.map((t) => t.to));
  return visibleNav(MAIN_NAV, permissions).filter((item) => !tabs.has(item.to));
}
