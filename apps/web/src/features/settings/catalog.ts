import { LIST_DEFS, LIST_KEYS, SETTING_HELP } from "@clinic/shared";

/** 6.5.1: Settings hub groups — path matches SettingsScreen routes. */
export type SettingsGroupId =
  "clinic" | "lists" | "templates" | "staff" | "preferences" | "numbers" | "system";

export type SettingsSectionDef = {
  path: string;
  label: string;
  group: SettingsGroupId;
  permission: string;
  /** Extra words for search (English). */
  keywords: string[];
};

export const SETTINGS_GROUPS: { id: SettingsGroupId; label: string }[] = [
  { id: "clinic", label: "Clinic" },
  { id: "lists", label: "Lists" },
  { id: "templates", label: "Templates" },
  { id: "staff", label: "Users" },
  { id: "preferences", label: "Preferences" },
  { id: "numbers", label: "Number series" },
  { id: "system", label: "System" },
];

const LIST_SECTIONS: SettingsSectionDef[] = LIST_KEYS.map((key) => ({
  path: key,
  label: LIST_DEFS[key].title,
  group: "lists" as const,
  permission: "settings.read",
  keywords: [LIST_DEFS[key].itemName, LIST_DEFS[key].help, key.replaceAll("_", " ")],
}));

export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    path: "clinic",
    label: "Clinic details",
    group: "clinic",
    permission: "settings.read",
    keywords: [
      "name",
      "address",
      "phone",
      "logo",
      "doctor",
      "registration",
      "letterhead",
      SETTING_HELP["clinic.name"],
      SETTING_HELP["doctor.registration_no"],
    ],
  },
  {
    path: "timings",
    label: "Timings and holidays",
    group: "clinic",
    permission: "settings.read",
    keywords: [
      "hours",
      "lunch",
      "slot",
      "chair",
      "closed",
      "holiday",
      SETTING_HELP["clinic.timings"],
    ],
  },
  {
    path: "billing",
    label: "Billing",
    group: "clinic",
    permission: "settings.read",
    keywords: ["gst", "tax", "shadow", "bill", "receipt", SETTING_HELP["billing.gst_mode"]],
  },
  ...LIST_SECTIONS,
  {
    path: "consent-templates",
    label: "Consent templates",
    group: "templates",
    permission: "settings.write",
    keywords: ["consent", "extraction", "treatment", "form", SETTING_HELP["consent.templates"]],
  },
  {
    path: "privacy-notice",
    label: "Privacy notice",
    group: "templates",
    permission: "settings.read",
    keywords: ["privacy", "notice", "DPDP", SETTING_HELP["privacy_notice.body"]],
  },
  {
    path: "staff",
    label: "Staff",
    group: "staff",
    permission: "staff.manage",
    keywords: ["users", "doctor", "receptionist", "gmail", "role"],
  },
  {
    path: "preferences",
    label: "Preferences",
    group: "preferences",
    permission: "settings.read",
    keywords: [
      "chart",
      "notation",
      "FDI",
      "Palmer",
      "Universal",
      "facing",
      "print",
      SETTING_HELP["chart.view"],
    ],
  },
  {
    path: "numbers",
    label: "Number series",
    group: "numbers",
    permission: "settings.read",
    keywords: [
      "counter",
      "patient code",
      "bill",
      "receipt",
      "prescription",
      "certificate",
      SETTING_HELP["patient_code.prefix"],
    ],
  },
  {
    path: "system",
    label: "Backup and storage",
    group: "system",
    permission: "settings.read",
    keywords: [
      "backup",
      "storage",
      "files",
      "GB",
      "Healthchecks",
      SETTING_HELP["files.storage_warn_gb"],
    ],
  },
  {
    path: "messages",
    label: "Messages",
    group: "system",
    permission: "settings.read",
    keywords: ["SMS", "WhatsApp", "email", "reminder", "template"],
  },
];

export function filterSettingsSections(
  sections: SettingsSectionDef[],
  query: string,
): SettingsSectionDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return sections;
  return sections.filter((s) => {
    const hay = [s.label, s.path, ...s.keywords].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

/** Clicks from Settings home: open Settings (1) → search/nav (2) → section (3). */
export function settingsReachableInThreeClicks(path: string): boolean {
  return SETTINGS_SECTIONS.some((s) => s.path === path);
}
