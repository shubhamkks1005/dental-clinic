import {
  istDate,
  istMinutes,
  isAllowedStatusTransition,
  statusTransitionBlockReason,
  type AppointmentStatus,
} from "@clinic/shared";
import { useState, type ReactNode } from "react";
import { Menu, type MenuItem } from "../../ui/Menu";
import { useToast } from "../../ui/Toast";
import { CancelMissedDialog } from "./CancelMissedDialog";
import { LazyBookPopover } from "./book/LazyBookPopover";

export type ActionableAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  visitTypeId: string;
  status: AppointmentStatus;
  version: number;
  startAt: string;
  updatedAt: string;
  /** Move mode keeps the doctor and the length (P5.7.11); old callers may leave them out. */
  dateLocal?: string;
  startMin?: number;
  endMin?: number;
  doctorId?: string | null;
};

type Props = {
  row: ActionableAppointment;
  onChanged: () => void;
  /** "panel" (calendar side panel, Calendar.dc.html): Reschedule as the main button, `children`
   * (Open profile) under it, then Cancel and Missed as plain buttons. Default: one "..." menu. */
  layout?: "menu" | "panel";
  children?: ReactNode;
  /** More lines for the "..." menu, before Reschedule (the desk adds Ask the doctor, Skip ...). */
  extraItems?: MenuItem[];
};

// Q1.4: one "..." menu for Reschedule, Cancel and Missed, used on Today, the calendar panel and
// the patient's Appointments tab. It owns its dialogs so each screen only places it.
export function AppointmentActions({
  row,
  onChanged,
  layout = "menu",
  children,
  extraItems = [],
}: Props) {
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
  const items: MenuItem[] = [...extraItems];
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
  if (items.length === 0) return layout === "panel" ? <>{children}</> : null;

  const reschedule = items.find((i) => i.label === "Reschedule");
  const others = items.filter((i) => i !== reschedule);

  return (
    <>
      {layout === "panel" ? (
        <>
          {reschedule ? (
            <button type="button" className="btn btn-primary" onClick={reschedule.onSelect}>
              Reschedule
            </button>
          ) : null}
          {children}
          {others.length > 0 ? (
            <div className="day-details-cancel">
              <p className="small muted">Cancel or mark as missed (a reason is needed):</p>
              {others.map((i) => (
                <button
                  key={i.label}
                  type="button"
                  className="btn"
                  disabled={i.disabled}
                  onClick={i.onSelect}
                >
                  {i.label === "Cancel" ? "Cancel appointment" : i.label}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <Menu label={`More actions for ${row.patientName}`} trigger="..." items={items} />
      )}
      <CancelMissedDialog
        open={dialog === "cancel" || dialog === "missed"}
        mode={dialog === "missed" ? "missed" : "cancel"}
        patientName={row.patientName}
        appointment={row}
        onClose={() => setDialog(null)}
        onDone={(text, undo) => {
          toast({
            text,
            action: undo
              ? {
                  label: "Undo",
                  onClick: () =>
                    void undo()
                      .then(() => {
                        toast({ text: `Put ${row.patientName}'s appointment back.` });
                        onChanged();
                      })
                      .catch((e: unknown) =>
                        toast({
                          text: e instanceof Error ? e.message : "Could not undo.",
                          tone: "error",
                        }),
                      ),
                }
              : undefined,
          });
          onChanged();
        }}
      />
      {dialog === "reschedule" ? (
        <LazyBookPopover
          request={{
            mode: "move",
            anchor: null,
            side: "auto",
            dateLocal: row.dateLocal ?? istDate(new Date()),
            startMin: row.startMin ?? Math.ceil(istMinutes(new Date()) / 15) * 15,
            patientId: row.patientId,
            visitTypeId: row.visitTypeId,
            doctorId: row.doctorId ?? undefined,
            durationMin:
              row.startMin !== undefined && row.endMin !== undefined
                ? row.endMin - row.startMin
                : undefined,
            move: { id: row.id, version: row.version },
          }}
          onBooked={() => {
            onChanged();
            return null;
          }}
          onReload={onChanged}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}
