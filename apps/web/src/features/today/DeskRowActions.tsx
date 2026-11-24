import { useState } from "react";
import { problemText } from "../../api/problem-text";
import { AppointmentActions, type ActionableAppointment } from "../appointments";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import type { MenuItem } from "../../ui/Menu";
import { useToast } from "../../ui/Toast";
import { AskDoctorDialog } from "./AskDoctorDialog";
import { moveAppointment, type QueueAction } from "./doctor/doctor-api";

type Props = {
  row: ActionableAppointment;
  onChanged: () => void;
  /** Called after the doctor was asked, so the "Asked the doctor" strip refreshes. */
  onAsked: () => void;
};

const CONFIRM: Record<
  "skip" | "pull-forward" | "late",
  { title: string; message: (n: string) => string; go: string; done: string }
> = {
  skip: {
    title: "Skip this patient?",
    message: (n) => `${n} moves one slot down in the doctor's list and is marked Stepped out.`,
    go: "Skip",
    done: "Skipped. The doctor's list is updated.",
  },
  "pull-forward": {
    title: "Pull this patient forward?",
    message: (n) => `${n} moves one slot up in the doctor's list.`,
    go: "Pull forward",
    done: "Moved up one slot.",
  },
  late: {
    title: "Late, coming today?",
    message: (n) => `${n} goes to the back of the doctor's list. Same appointment, no new charge.`,
    go: "Move to the back",
    done: "Moved to the back of the list.",
  },
};

/**
 * T2.8: the desk's "..." menu on Today: the usual Reschedule, Cancel and Missed, plus Ask the
 * doctor, and Skip, Pull forward and Late arrived for a patient who is waiting (the same rules and
 * the same API as the doctor's list, so the doctor sees "Order updated by <name>").
 */
export function DeskRowActions({ row, onChanged, onAsked }: Props) {
  const toast = useToast();
  const [ask, setAsk] = useState(false);
  const [pending, setPending] = useState<"skip" | "pull-forward" | "late" | null>(null);
  const [busy, setBusy] = useState(false);
  const open = row.status === "scheduled" || row.status === "confirmed" || row.status === "arrived";
  const waiting = row.status === "arrived";

  const items: MenuItem[] = [];
  if (open) items.push({ label: "Ask the doctor...", onSelect: () => setAsk(true) });
  if (waiting) {
    items.push(
      { label: "Pull forward", onSelect: () => setPending("pull-forward") },
      { label: "Skip", onSelect: () => setPending("skip") },
      { label: "Late arrived", onSelect: () => setPending("late") },
    );
  }

  async function confirm(action: QueueAction & ("skip" | "pull-forward" | "late")) {
    setBusy(true);
    try {
      await moveAppointment(row.id, action, row.version);
      toast({ text: CONFIRM[action].done });
      setPending(null);
      onChanged();
    } catch (e: unknown) {
      toast({ text: problemText(e), tone: "error" });
      setPending(null);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const c = pending ? CONFIRM[pending] : null;
  return (
    <>
      <AppointmentActions row={row} onChanged={onChanged} extraItems={items} />
      <AskDoctorDialog
        open={ask}
        patientName={row.patientName}
        appointmentId={row.id}
        onClose={() => setAsk(false)}
        onSent={() => {
          toast({ text: "Sent to the doctor." });
          onAsked();
        }}
      />
      <ConfirmDialog
        open={c !== null}
        title={c?.title ?? ""}
        message={c ? c.message(row.patientName) : ""}
        confirmLabel={c?.go ?? "OK"}
        busy={busy}
        onConfirm={() => pending && void confirm(pending)}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
