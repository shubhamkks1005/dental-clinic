import { TextInput } from "../../ui/form";
type Props = {
  from: string;
  to: string;
  tooth: string;
  q: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onTooth: (v: string) => void;
  onQ: (v: string) => void;
  onApply: () => void;
};

/** 6.7.1: date range, tooth, and text search below the chips. */
export function HistoryFilterExtras({
  from,
  to,
  tooth,
  q,
  onFrom,
  onTo,
  onTooth,
  onQ,
  onApply,
}: Props) {
  return (
    <form
      className="history-filter-extras"
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <label>
        From
        <TextInput
          type="date"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          aria-label="History from date"
        />
      </label>
      <label>
        To
        <TextInput
          type="date"
          value={to}
          onChange={(e) => onTo(e.target.value)}
          aria-label="History to date"
        />
      </label>
      <label>
        Tooth
        <TextInput
          type="number"
          inputMode="numeric"
          min={11}
          max={85}
          placeholder="36"
          value={tooth}
          onChange={(e) => onTooth(e.target.value)}
          aria-label="Filter by tooth number"
        />
      </label>
      <label className="history-filter-search">
        Search
        <TextInput
          type="search"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Procedure or diagnosis"
          aria-label="Search procedure or diagnosis"
        />
      </label>
      <button type="submit" className="btn btn-compact">
        Apply
      </button>
    </form>
  );
}
