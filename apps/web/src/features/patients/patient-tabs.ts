// 2.2.2: only ship tabs whose phase is ready. Sister must not see unfinished tabs.
export const PATIENT_PROFILE_TABS = [
  { id: "overview", label: "Overview", ready: true },
  { id: "appointments", label: "Appointments", ready: true },
  { id: "chart", label: "Chart", ready: true }, // 3.4.5 (full visit screen still 3.5.x)
  { id: "visits", label: "Visits", ready: false }, // Phase 3
  { id: "billing", label: "Billing", ready: false }, // Phase 5
  { id: "files", label: "Files", ready: false }, // Phase 3
  { id: "messages", label: "Messages", ready: false }, // Phase 7
] as const;

export type PatientProfileTabId = (typeof PATIENT_PROFILE_TABS)[number]["id"];

export function readyPatientTabs() {
  return PATIENT_PROFILE_TABS.filter((t) => t.ready);
}
