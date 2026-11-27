import { remainingAsDiscount, visitMoney, type ExtraPaidChoice } from "@clinic/shared";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { updateDraftBill, type BillDto } from "../billing/api";
import {
  applyDiscount,
  lockInvoice,
  saveInvoiceNote,
  startInvoice,
  type VisitAfterDto,
} from "./api";
import {
  itemsForSave,
  linePaise,
  linesFromBill,
  linesProblem,
  subtotalPaise,
  type Line,
} from "./invoice-model";

export type Mode = "editing" | "saved" | "locked";
export type SaveState = "idle" | "saving" | "saved" | "failed";

// The invoice part of the page (review Q2, DECISIONS 2026-11-27): Save keeps a draft; then Edit or
// Lock. Pass, Print, Download and Take payment lock first (after a confirm). Money is never
// optimistic: the on-screen total is a preview until the server answers.
export function useInvoice(opts: {
  visitId: string;
  after: VisitAfterDto;
  bill: BillDto | null;
  setBill: (b: BillDto | null) => void;
}) {
  const { visitId, after, bill, setBill } = opts;
  const [lines, setLines] = useState<Line[]>(() => (bill ? linesFromBill(bill) : []));
  const [discountRupees, setDiscountRupees] = useState(() =>
    String((bill?.discountPaise ?? 0) / 100),
  );
  const [reason, setReason] = useState(bill?.discountReason ?? "settled");
  const [note, setNote] = useState(bill?.notes ?? "");
  const [mode, setMode] = useState<Mode>(() => modeOf(bill, false));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [extra, setExtra] = useState<ExtraPaidChoice | null>(null);

  // A newer invoice from the server (another tab, the desk): take it unless the doctor is typing.
  useEffect(() => {
    if (!bill || mode === "editing") return;
    setLines(linesFromBill(bill));
    setDiscountRupees(String(bill.discountPaise / 100));
    setNote(bill.notes);
    setMode(modeOf(bill, true));
  }, [bill]);

  const locked = bill?.status === "issued";
  const discountPaise = Math.round((Number(discountRupees) || 0) * 100);
  const subtotal = subtotalPaise(lines);
  const total = locked && bill ? bill.totalPaise : Math.max(0, subtotal - discountPaise);
  const paid = locked && bill ? (bill.paidPaise ?? 0) : after.arrival.totalPaise;
  const money = visitMoney(total, paid);
  const problem =
    discountPaise > subtotal
      ? `Discount cannot be more than ₹${(subtotal / 100).toLocaleString("en-IN")}.`
      : lines.length || bill
        ? linesProblem(lines)
        : null;
  const dirty = useMemo(
    () => (bill ? isDirty(bill, lines, discountPaise, note) : lines.length > 0),
    [bill, lines, discountPaise, note],
  );

  async function save(): Promise<BillDto | null> {
    if (problem) return (setError(problem), null);
    setSaveState("saving");
    setError(null);
    try {
      let b = bill;
      if (!b) {
        const first = lines[0]!;
        b = await startInvoice(visitId, linePaise(first) ?? 0);
      }
      if (!bill || isDirtyLines(b, lines)) {
        b = await updateDraftBill(b.id, { version: b.version, items: itemsForSave(lines) });
      }
      if (discountPaise !== b.discountPaise) {
        b = await applyDiscount(b.id, { version: b.version, discountPaise, reason });
      }
      if (note.trim() !== b.notes) b = await saveInvoiceNote(b.id, b.version, note.trim());
      setBill(b);
      setMode("saved");
      setSaveState("saved");
      return b;
    } catch (err) {
      setSaveState("failed");
      setError(conflictText(err));
      return null;
    }
  }

  /** Lock (issue). Saves first when something changed. Returns the locked invoice or null. */
  async function lock(): Promise<BillDto | null> {
    if (money.kind === "extra" && !extra) {
      setError("Choose Returned or Keep as advance.");
      return null;
    }
    const b = dirty || !bill ? await save() : bill;
    if (!b) return null;
    if (b.status === "issued") return b;
    setSaveState("saving");
    try {
      const r = await lockInvoice(b.id, b.version, money.kind === "extra" ? extra : null);
      setBill(r.bill);
      setMode("locked");
      setSaveState("saved");
      setError(r.refundError);
      return r.bill;
    } catch (err) {
      setSaveState("failed");
      setError(conflictText(err));
      return null;
    }
  }

  async function saveNoteOnly() {
    if (!bill) return;
    setSaveState("saving");
    try {
      setBill(await saveInvoiceNote(bill.id, bill.version, note.trim()));
      setSaveState("saved");
    } catch (err) {
      setSaveState("failed");
      setError(conflictText(err));
    }
  }

  return {
    lines,
    setLines: (l: Line[]) => (setLines(l), setMode("editing")),
    discountRupees,
    setDiscountRupees: (v: string) => (setDiscountRupees(v), setMode("editing")),
    remainingAsDiscount: () => {
      setDiscountRupees(String(remainingAsDiscount(subtotal, after.arrival.totalPaise) / 100));
      setReason("settled");
      setMode("editing");
    },
    reason,
    setReason,
    note,
    setNote,
    mode,
    edit: () => setMode("editing"),
    saveState,
    error,
    setError,
    extra,
    setExtra,
    locked,
    subtotal,
    discountPaise,
    total,
    paid,
    money,
    problem,
    dirty,
    save,
    lock,
    saveNoteOnly,
  };
}

function modeOf(bill: BillDto | null, saved: boolean): Mode {
  if (bill?.status === "issued") return "locked";
  return bill && saved ? "saved" : bill ? "saved" : "editing";
}

function isDirtyLines(bill: BillDto, lines: Line[]) {
  const a = JSON.stringify(itemsForSave(linesFromBill(bill)));
  return a !== JSON.stringify(itemsForSave(lines));
}

function isDirty(bill: BillDto, lines: Line[], discountPaise: number, note: string) {
  return (
    isDirtyLines(bill, lines) || discountPaise !== bill.discountPaise || note.trim() !== bill.notes
  );
}

function conflictText(err: unknown) {
  if (err instanceof ApiError && err.status === 409) {
    return "The desk changed this invoice. Showing the latest.";
  }
  return problemText(err);
}
