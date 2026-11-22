/** 3.5.11: filter chip strip placeholder; polish in 6.7.1. */
const CHIPS = [
  "All",
  "Visits",
  "Treatments",
  "Prescriptions",
  "Bills",
  "Files",
  "Appointments",
] as const;

export function HistoryFilterChips() {
  return (
    <div className="history-filters" role="group" aria-label="History filters">
      {CHIPS.map((label) => (
        <button
          key={label}
          type="button"
          className={label === "All" ? "btn btn-compact is-active" : "btn btn-compact"}
          disabled={label !== "All"}
          aria-pressed={label === "All"}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
