import type { BoardMessage, MessagesBoard } from "./api";

export type MessageTab = "send" | "opened" | "old" | "attention";

export type PatientGroup = {
  patientId: string;
  patientName: string;
  patientCode: string;
  sentTo: string | null;
  booking: BoardMessage["booking"];
  /** Ready to send now (or the rows of the chosen tab). */
  rows: BoardMessage[];
  /** Same patient, not due yet: shown dimmed under the ready ones ("Not due yet"). */
  later: BoardMessage[];
  /** Same patient, withdrawn: shown dimmed ("Withdrawn: appointment moved"). */
  withdrawn: BoardMessage[];
};

export const KIND_WORD: Record<string, string> = {
  confirm: "Confirmation",
  remind: "Reminder",
  same_day_remind: "Reminder today",
  reschedule: "Moved",
  cancel: "Cancelled",
  recall: "Recall",
  incomplete: "Next visit",
  dues: "Payment",
};

function byId(rows: BoardMessage[]): BoardMessage[] {
  return [...new Map(rows.map((r) => [r.id, r])).values()];
}

/** Rows that can be sent by hand now: the same two buckets the old page showed side by side. */
export function toSend(board: MessagesBoard): BoardMessage[] {
  return byId([...board.whatsapp, ...board.outgoing]);
}

export function tabRows(board: MessagesBoard, tab: MessageTab): BoardMessage[] {
  if (tab === "send") return toSend(board);
  if (tab === "opened") return board.sentToday;
  if (tab === "old") return board.outOfDate;
  return board.attention.filter((r) => r.skipReason !== "no_number");
}

/** One card per patient (and booking), in the order the first message was queued. */
export function groupByPatient(board: MessagesBoard, tab: MessageTab): PatientGroup[] {
  const groups = new Map<string, PatientGroup>();
  const key = (r: BoardMessage) => `${r.patientId}:${r.appointmentId ?? ""}`;
  const add = (r: BoardMessage, into: "rows" | "later" | "withdrawn") => {
    let g = groups.get(key(r));
    if (!g) {
      g = {
        patientId: r.patientId,
        patientName: r.patientName,
        patientCode: r.patientCode,
        sentTo: r.sentTo,
        booking: r.booking,
        rows: [],
        later: [],
        withdrawn: [],
      };
      groups.set(key(r), g);
    }
    g[into].push(r);
  };
  const main = tabRows(board, tab);
  for (const r of main) add(r, "rows");
  // "To send" also shows what is waiting for the same patient, so one card tells the whole story.
  if (tab === "send") {
    for (const r of board.scheduled) add(r, "later");
    for (const r of board.outOfDate) if (groups.has(key(r))) add(r, "withdrawn");
  }
  return [...groups.values()];
}

/** Only the rows that are ready to send count for the tab badge (not the "later" ones). */
export function tabCount(board: MessagesBoard, tab: MessageTab): number {
  return tabRows(board, tab).length;
}
