import type { HistoryFilterChip } from "@clinic/shared";
import { HISTORY_FILTER_CHIPS } from "@clinic/shared";

const CHIP_LABEL: Record<HistoryFilterChip, string> = {
  all: "All",
  visits: "Visits",
  treatments: "Treatments",
  prescriptions: "Prescriptions",
  bills: "Bills",
  files: "Files",
  appointments: "Appointments",
};

type Props = {
  chip: HistoryFilterChip;
  onChip: (chip: HistoryFilterChip) => void;
};

/** 6.7.1: History type chips (S04/S17). Never hide the pinned summary. */
export function HistoryFilterChips({ chip, onChip }: Props) {
  return (
    <div className="history-filters" role="group" aria-label="History type">
      {HISTORY_FILTER_CHIPS.map((id) => (
        <button
          key={id}
          type="button"
          className={id === chip ? "btn btn-compact is-active" : "btn btn-compact"}
          aria-pressed={id === chip}
          onClick={() => onChip(id)}
        >
          {CHIP_LABEL[id]}
        </button>
      ))}
    </div>
  );
}
