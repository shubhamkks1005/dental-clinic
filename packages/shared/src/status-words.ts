// ONE vocabulary for statuses (IDEAL_EXPERIENCE section 0). Screens and print ask this map;
// nobody shows a raw system value. Tone names are the badge classes in apps/web/src/ui/ui.css.
export type StatusTone = "done" | "in-room" | "waiting" | "emergency" | "upcoming";
export type StatusWord = { label: string; tone: StatusTone; struck?: true };
export type StatusKind = "appointment" | "visit" | "bill";

const APPOINTMENT: Record<string, StatusWord> = {
  scheduled: { label: "Booked", tone: "upcoming" },
  confirmed: { label: "Booked", tone: "upcoming" },
  arrived: { label: "Waiting", tone: "waiting" },
  in_chair: { label: "In chair", tone: "in-room" },
  completed: { label: "Done", tone: "done" },
  no_show: { label: "Missed", tone: "emergency" },
  cancelled: { label: "Cancelled", tone: "upcoming", struck: true },
  rescheduled: { label: "Moved", tone: "upcoming" },
};

const VISIT: Record<string, StatusWord> = {
  draft: { label: "Draft", tone: "upcoming" },
  final: { label: "Final", tone: "done" },
  void: { label: "Cancelled", tone: "upcoming", struck: true },
};

const BILL: Record<string, StatusWord> = {
  draft: { label: "Draft", tone: "upcoming" },
  open: { label: "Open", tone: "waiting" },
  part_paid: { label: "Part paid", tone: "waiting" },
  paid: { label: "Paid", tone: "done" },
  cancelled: { label: "Cancelled", tone: "upcoming", struck: true },
};

const MAPS: Record<StatusKind, Record<string, StatusWord>> = {
  appointment: APPOINTMENT,
  visit: VISIT,
  bill: BILL,
};

// A word for any value; an unknown value shows neutral and capitalised, never the raw code.
export function statusWord(kind: StatusKind, value: string): StatusWord {
  const known = MAPS[kind][value];
  if (known) return known;
  const text = value.replace(/_/g, " ").trim();
  return { label: text.charAt(0).toUpperCase() + text.slice(1), tone: "upcoming" };
}

// The bill statuses in the database are draft / issued / cancelled; Open, Part paid and Paid
// come from how much has been paid (integer paise).
export function billStatusKey(
  status: string,
  totalPaise: number,
  paidPaise: number,
): "draft" | "open" | "part_paid" | "paid" | "cancelled" {
  if (status === "draft") return "draft";
  if (status === "cancelled") return "cancelled";
  if (totalPaise > 0 && paidPaise >= totalPaise) return "paid";
  return paidPaise > 0 ? "part_paid" : "open";
}
