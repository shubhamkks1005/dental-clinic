import { formatDisplayDate } from "@clinic/shared";

// The page title while a print screen is open. Browsers use it as the file name when staff
// choose "Save as PDF", e.g. "Prescription P-000412 22-11-2026".
export function printTitle(kind: string, patientNo: string, isoDate: string): string {
  return `${kind} ${patientNo} ${formatDisplayDate(isoDate).replaceAll("/", "-")}`;
}
