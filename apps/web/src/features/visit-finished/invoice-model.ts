import { formatClockTime, formatRupees, istMinutes } from "@clinic/shared";
import type { BillDto } from "../billing/api";
import type { VisitAfterDto } from "./api";

// Visit finished page: the invoice being edited, as plain data and plain functions (tested).

export type Line = {
  key: string;
  label: string;
  toothFdi: number | null;
  qty: number;
  /** What is typed in the amount box, in whole rupees ("" = no fee yet). */
  rupees: string;
  listItemId: string | null;
  planItemId: string | null;
  visitProcedureId: string | null;
  listUnitPaise: number | null;
  isConsult: boolean;
};

export const CONSULT_LABEL = "Consultation";
let seq = 0;
const newKey = () => `new-${++seq}`;

export function linesFromBill(bill: BillDto): Line[] {
  return bill.items.map((i) => ({
    key: i.id,
    label: i.procedureLabel,
    toothFdi: i.toothFdi,
    qty: i.qty,
    rupees: i.unitPaise > 0 ? String(i.unitPaise / 100) : "",
    listItemId: i.listItemId,
    planItemId: i.planItemId,
    visitProcedureId: i.visitProcedureId,
    listUnitPaise: i.listUnitPaise,
    isConsult: i.procedureLabel === CONSULT_LABEL && !i.visitProcedureId && !i.listItemId,
  }));
}

export function blankLine(label = "Custom item", paise = 0, isConsult = false): Line {
  return {
    key: newKey(),
    label,
    toothFdi: null,
    qty: 1,
    rupees: paise > 0 ? String(paise / 100) : "",
    listItemId: null,
    planItemId: null,
    visitProcedureId: null,
    listUnitPaise: null,
    isConsult,
  };
}

/** Typed rupees to paise; "" or junk = null (no fee yet). */
export function linePaise(line: Line): number | null {
  const n = Number(line.rupees);
  if (line.rupees.trim() === "" || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function subtotalPaise(lines: Line[]): number {
  return lines.reduce((s, l) => s + (linePaise(l) ?? 0) * l.qty, 0);
}

/** Why Save / Lock cannot run yet, in words (handoff L3, L4), or null. */
export function linesProblem(lines: Line[]): string | null {
  if (lines.length === 0) return "An invoice needs at least one line.";
  const noFee = lines.find((l) => !linePaise(l));
  if (noFee) return `${noFee.label || "A line"} has no amount.`;
  if (lines.some((l) => !l.label.trim())) return "Every line needs a name.";
  return null;
}

export function itemsForSave(lines: Line[]) {
  return lines.map((l) => ({
    procedureLabel: l.label.trim(),
    toothFdi: l.toothFdi,
    qty: Math.min(99, Math.max(1, l.qty)),
    unitPaise: linePaise(l) ?? 0,
    listItemId: l.listItemId,
    planItemId: l.planItemId,
    visitProcedureId: l.visitProcedureId,
    listUnitPaise: l.listUnitPaise,
  }));
}

export type Missing = { id: string; label: string; toothFdi: number | null };

/** Done today but not on the invoice (owner decision 2026-11-26), minus the ones kept off. */
export function missingProcedures(
  procedures: VisitAfterDto["procedures"],
  lines: Line[],
  keptOff: ReadonlySet<string>,
): Missing[] {
  return procedures
    .filter((p) => !keptOff.has(p.id))
    .filter(
      (p) =>
        !lines.some(
          (l) =>
            l.visitProcedureId === p.id ||
            (l.label.trim().toLowerCase().startsWith(p.label.toLowerCase()) &&
              (l.toothFdi ?? null) === (p.toothFdi ?? null)),
        ),
    )
    .map((p) => ({ id: p.id, label: p.label, toothFdi: p.toothFdi }));
}

export const toothText = (fdi: number | null) => (fdi ? ` (${fdi})` : "");

export function istClock(iso: string): string {
  return formatClockTime(istMinutes(new Date(iso))).toLowerCase();
}

/** "Consultation ₹500 · X-ray ₹500 · 10:05 am · Priya": what for (from the desk's note), else mode. */
export function arrivalText(items: VisitAfterDto["arrival"]["items"]): string {
  if (items.length === 0) return "";
  const parts = items.map((i) => {
    const forWhat = i.notes.replace(/^For:\s*/i, "").trim();
    return `${forWhat || modeWord(i.mode)} ${formatRupees(i.unallocatedPaise)}`;
  });
  const last = items[items.length - 1]!;
  const who = last.receivedByName ? ` · ${last.receivedByName}` : "";
  return `${parts.join(" · ")} · ${istClock(last.receivedAt)}${who}`;
}

const MODE: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank: "Bank",
  cheque: "Cheque",
  other: "Other",
};
export const modeWord = (m: string) => MODE[m] ?? m;
