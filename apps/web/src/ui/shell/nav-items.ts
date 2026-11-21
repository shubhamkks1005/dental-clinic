import type { IconName } from "../icons";

export type NavItem = { to: string; label: string; icon: IconName };

// Laptop sidebar and tablet tabs (DESIGN.md: 7 items).
export const MAIN_NAV: NavItem[] = [
  { to: "/app", label: "Today", icon: "today" },
  { to: "/app/patients", label: "Patients", icon: "patients" },
  { to: "/app/appointments", label: "Appointments", icon: "calendar" },
  { to: "/app/billing", label: "Billing", icon: "billing" },
  { to: "/app/messages", label: "Messages", icon: "messages" },
  { to: "/app/reports", label: "Reports", icon: "reports" },
  { to: "/app/settings", label: "Settings", icon: "settings" },
];

// Phone bottom tab bar (DESIGN.md: 5 items).
export const PHONE_TABS: NavItem[] = [
  { to: "/app", label: "Today", icon: "today" },
  { to: "/app/patients", label: "Patients", icon: "patients" },
  { to: "/app/appointments", label: "Calendar", icon: "calendar" },
  { to: "/app/billing", label: "Billing", icon: "billing" },
  { to: "/app/more", label: "More", icon: "more" },
];

export const NEW_PATIENT_PATH = "/app/patients/new";
