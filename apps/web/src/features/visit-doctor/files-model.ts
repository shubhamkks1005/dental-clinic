import { historyDate } from "./tooth-model";

const KIND: Record<string, string> = {
  iopa: "X-ray (IOPA)",
  opg: "OPG",
  photo: "Photo",
  scan: "Scan",
  consent: "Consent",
};

/** "X-ray (IOPA) 36 · 22 Nov 2026" as the file buttons of Accordion 4 say it. */
export function fileLabel(f: {
  kind: string;
  toothFdi: number | null;
  takenOn: string | null;
  createdAt: string;
}): string {
  const kind = KIND[f.kind] ?? "File";
  const tooth = f.toothFdi ? ` ${f.toothFdi}` : "";
  const day = f.takenOn ? historyDate(`${f.takenOn}T06:00:00.000Z`) : historyDate(f.createdAt);
  return `${kind}${tooth} · ${day}`;
}
