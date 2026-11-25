/**
 * 6.5.3: clinic tunables — defaults and bounds live here only (not scattered in feature code).
 * Each key also has a SETTING_SCHEMAS entry and a seed row.
 */
export const TUNABLES = {
  "appointments.book_ahead_days": {
    default: 90,
    min: 1,
    max: 365,
    label: "Book ahead (days)",
    help: "How far ahead a normal booking may go. Example: 90. Changing this does not move existing appointments.",
  },
  "appointments.no_show_after_minutes": {
    default: 15,
    min: 1,
    max: 120,
    label: "No-show after (minutes)",
    help: "Minutes after the start time before staff may mark no-show. Example: 15.",
  },
  "appointments.status_undo_hours": {
    default: 24,
    min: 1,
    max: 72,
    label: "Undo cancel/no-show (hours)",
    help: "Hours to put a cancelled or no-show visit back on the schedule. Example: 24.",
  },
  "appointments.late_after_minutes": {
    default: 10,
    min: 1,
    max: 120,
    label: "Late after (minutes)",
    help: "Minutes after the start time a patient is marked late. Example: 10.",
  },
  "today.running_late_after_minutes": {
    default: 10,
    min: 1,
    max: 120,
    label: "Running late chip after (minutes)",
    help: "Show the doctor's late chip when the first patient starts this many minutes after the booked time. Example: 10.",
  },
  "medical_history.stale_months": {
    default: 6,
    min: 1,
    max: 36,
    label: "Medical history review (months)",
    help: "Ask again when the last review is older than this. Example: 6.",
  },
  "ui.auto_refresh_seconds": {
    default: 60,
    min: 15,
    max: 300,
    label: "Today auto-refresh (seconds)",
    help: "How often Today and Appointments reload while the tab is open. Example: 60.",
  },
  "files.storage_warn_gb": {
    default: 7,
    min: 1,
    max: 20,
    label: "Storage warn (GB)",
    help: "Yellow warning when file storage reaches this many gigabytes. Example: 7.",
  },
  "files.storage_crit_gb": {
    default: 9,
    min: 1,
    max: 20,
    label: "Storage critical (GB)",
    help: "Red alert when file storage reaches this many gigabytes. Example: 9.",
  },
  "outreach.incomplete_days": {
    default: 30,
    min: 1,
    max: 365,
    label: "Incomplete treatment (days)",
    help: "Accepted plan items with no sitting for this many days appear on the call list. Example: 30.",
  },
  "outreach.recall_min_months": {
    default: 6,
    min: 1,
    max: 24,
    label: "Recall from (months)",
    help: "Recall list: last visit at least this many months ago. Example: 6.",
  },
  "outreach.recall_max_months": {
    default: 9,
    min: 1,
    max: 36,
    label: "Recall until (months)",
    help: "Recall list: last visit at most this many months ago. Example: 9.",
  },
  "billing.consultation_fee_paise": {
    default: 0,
    min: 0,
    max: 10_000_000,
    label: "Usual consultation fee (paise)",
    help: "One tap on the visit finished page adds this as a Consultation line on the bill. 0 means not set: the doctor types the amount each time. Example: 50000 is Rs 500.",
  },
  "records.demand_hours": {
    default: 72,
    min: 1,
    max: 168,
    label: "Records demand due (hours)",
    help: "DRAFT — hours to fulfill a patient records request when that feature ships. Example: 72.",
  },
} as const;

export type TunableKey = keyof typeof TUNABLES;

export const TUNABLE_KEYS = Object.keys(TUNABLES) as TunableKey[];

export function tunableDefault(key: TunableKey): number {
  return TUNABLES[key].default;
}
