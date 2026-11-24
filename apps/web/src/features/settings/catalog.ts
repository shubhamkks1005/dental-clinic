import { LIST_DEFS, LIST_KEYS, SETTING_HELP } from "@clinic/shared";

/** Settings hub groups (Settings.dc.html: 4 groups, 8 items). */
export type SettingsGroupId = "clinic" | "people" | "forms" | "system";

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
  { id: "people", label: "People" },
  { id: "forms", label: "Forms and messages" },
  { id: "system", label: "System" },
];

export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    path: "clinic",
    label: "Clinic and doctor",
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
    label: "Billing and tax",
    group: "clinic",
    permission: "settings.billing",
    keywords: ["gst", "tax", "shadow", "bill", "receipt", SETTING_HELP["billing.gst_mode"]],
  },
  {
    path: "staff",
    label: "Staff and access",
    group: "people",
    permission: "staff.manage",
    keywords: ["users", "doctor", "receptionist", "gmail", "role"],
  },
  {
    path: "consent",
    label: "Consent and privacy",
    group: "forms",
    permission: "settings.read",
    keywords: [
      "consent",
      "extraction",
      "treatment",
      "form",
      "privacy",
      "notice",
      "DPDP",
      SETTING_HELP["consent.templates"],
      SETTING_HELP["privacy_notice.body"],
    ],
  },
  {
    path: "messages",
    label: "Message templates",
    group: "forms",
    permission: "settings.read",
    keywords: ["SMS", "WhatsApp", "email", "reminder", "template"],
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
    path: "advanced",
    label: "Advanced",
    group: "system",
    permission: "settings.read",
    keywords: [
      "number series",
      "counter",
      "patient code",
      "bill",
      "receipt",
      "preferences",
      "chart",
      "notation",
      "FDI",
      "Palmer",
      "print",
      "error log",
      SETTING_HELP["patient_code.prefix"],
      SETTING_HELP["chart.view"],
    ],
  },
];

/** Old Settings paths that moved: they redirect so bookmarks keep working (path, new path). */
export const SETTINGS_REDIRECTS: Record<string, string> = {
  "consent-templates": "/app/settings/consent",
  "privacy-notice": "/app/settings/consent",
  numbers: "/app/settings/advanced",
  preferences: "/app/settings/advanced",
  ...Object.fromEntries(LIST_KEYS.map((key) => [key, `/app/library/${key}`])),
};

/** The doctor's lists live in the Library; the Settings search points there too. */
export const LIBRARY_HITS = LIST_KEYS.map((key) => ({
  to: `/app/library/${key}`,
  label: LIST_DEFS[key].title,
  keywords: [LIST_DEFS[key].itemName, LIST_DEFS[key].help, key.replaceAll("_", " ")],
}));

export function filterLibraryHits(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return LIBRARY_HITS.filter((h) => [h.label, ...h.keywords].join(" ").toLowerCase().includes(q));
}

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
