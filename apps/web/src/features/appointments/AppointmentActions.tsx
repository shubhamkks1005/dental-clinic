import {
  formatClockTime,
  formatDisplayDate,
  istDate,
  isAllowedStatusTransition,
  statusTransitionBlockReason,
  type AppointmentStatus,
} from "@clinic/shared";
import { useState } from "react";
import { Menu, type MenuItem } from "../../ui/Menu";
import { useToast } from "../../ui/Toast";
import { CancelMissedDialog } from "./CancelMissedDialog";
import { QuickBookDialog } from "./QuickBookDialog";

export type ActionableAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  visitTypeId: string;
  status: AppointmentStatus;
  version: number;
  startAt: string;
  updatedAt: string;
};

type Props = { row: ActionableAppointment; onChanged: () => void };

// Q1.4: one "..." menu for Reschedule, Cancel and Missed, used on Today, the calendar panel and
// the patient's Appointments tab. It owns its dialogs so each screen only places it.
export function AppointmentActions({ row, onChanged }: Props) {
  const toast = useToast();
  const [dialog, setDialog] = useState<"cancel" | "missed" | "reschedule" | null>(null);

  const from = row.status;
  const missedBlock = isAllowedStatusTransition(from, "no_show")
    ? statusTransitionBlockReason(from, "no_show", {
        startAt: new Date(row.startAt),
        statusChangedAt: new Date(row.updatedAt),
        now: new Date(),
      })
    : "not allowed";
  const items: MenuItem[] = [];
  if (isAllowedStatusTransition(from, "rescheduled")) {
    items.push({ label: "Reschedule", onSelect: () => setDialog("reschedule") });
  }
  if (isAllowedStatusTransition(from, "cancelled")) {
    items.push({ label: "Cancel", onSelect: () => setDialog("cancel") });
  }
  if (isAllowedStatusTransition(from, "no_show")) {
    items.push({
      label: missedBlock ? "Missed (later)" : "Missed",
      disabled: missedBlock !== null,
      onSelect: () => setDialog("missed"),
    });
  }
  if (items.length === 0) return null;

  return (
    <>
      <Menu label={`More actions for ${row.patientName}`} trigger="..." items={items} />
      <CancelMissedDialog
        open={dialog === "cancel" || dialog === "missed"}
        mode={dialog === "missed" ? "missed" : "cancel"}
        patientName={row.patientName}
        appointment={row}
        onClose={() => setDialog(null)}
        onDone={(text) => {
          toast({ text });
          onChanged();
        }}
      />
      <QuickBookDialog
        open={dialog === "reschedule"}
        prefill={{
          dateLocal: istDate(new Date()),
          patientId: row.patientId,
          visitTypeId: row.visitTypeId,
        }}
        reschedule={{ id: row.id, version: row.version }}
        onClose={() => setDialog(null)}
        onBooked={(slot) => {
          toast({
            text: `Moved to ${formatDisplayDate(slot.dateLocal)}, ${formatClockTime(slot.startMin)}`,
          });
          onChanged();
        }}
      />
    </>
  );
}
