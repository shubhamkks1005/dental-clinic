// Status colours from DESIGN.md. The label is always a word, never colour alone.
export type StatusTone = "done" | "in-room" | "waiting" | "emergency" | "upcoming";

export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  return <span className={`badge badge-${tone}`}>{label}</span>;
}
