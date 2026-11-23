// 2.2.2: only ship tabs whose phase is ready. Sister must not see unfinished tabs.
export const PATIENT_PROFILE_TABS = [
  { id: "overview", label: "Overview", ready: true },
  { id: "history", label: "History", ready: true }, // 3.5.11
  { id: "appointments", label: "Appointments", ready: true },
  { id: "chart", label: "Chart", ready: true }, // 3.4.5 (full visit screen still 3.5.x)
  { id: "visits", label: "Visits", ready: true }, // 3.5.9 timeline
  { id: "billing", label: "Billing", ready: true }, // 5.3.3
  { id: "files", label: "Files", ready: true }, // 3.7.4
  { id: "messages", label: "Messages", ready: true }, // 7.3.3
] as const;

export type PatientProfileTabId = (typeof PATIENT_PROFILE_TABS)[number]["id"];

/** Value of ?tab= if it names a real tab, else null. */
export function parsePatientTab(raw: string | null): PatientProfileTabId | null {
  return PATIENT_PROFILE_TABS.find((t) => t.id === raw)?.id ?? null;
}

export function readyPatientTabs() {
  return PATIENT_PROFILE_TABS.filter((t) => t.ready);
}
