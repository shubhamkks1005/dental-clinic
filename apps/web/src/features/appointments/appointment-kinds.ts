// Calendar colour by kind of visit (Calendar.dc.html legend). The label comes from the doctor's
// visit-type list, so we match words, not ids; anything unknown is "consult".
export type KindKey = "clean" | "consult" | "rct" | "ext" | "ortho" | "emer";

export const KIND_LEGEND: { key: KindKey; label: string }[] = [
  { key: "clean", label: "Cleaning" },
  { key: "consult", label: "Consultation, follow-up" },
  { key: "rct", label: "RCT" },
  { key: "ext", label: "Extraction" },
  { key: "ortho", label: "Ortho" },
  { key: "emer", label: "Emergency" },
];

export function kindOf(label: string): KindKey {
  const t = label.toLowerCase();
  if (/emerg|pain/.test(t)) return "emer";
  if (/clean|scal|polish/.test(t)) return "clean";
  if (/rct|root/.test(t)) return "rct";
  if (/extract/.test(t)) return "ext";
  if (/ortho|brace|wire|aligner|retain/.test(t)) return "ortho";
  return "consult";
}
