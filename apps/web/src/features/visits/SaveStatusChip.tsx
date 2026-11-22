import { saveStatusLabel, type SaveStatus } from "./visit-autosave";

type Props = { status: SaveStatus };

/** 3.5.5: Saved / Saving / Not saved chip. */
export function SaveStatusChip({ status }: Props) {
  const tone =
    status === "saved"
      ? "visit-save-ok"
      : status === "saving"
        ? "visit-save-busy"
        : "visit-save-warn";
  return (
    <span className={`visit-save-chip ${tone}`} role="status" aria-live="polite">
      {saveStatusLabel(status)}
    </span>
  );
}
