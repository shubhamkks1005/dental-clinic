import type { ListItem } from "@clinic/shared";

// Visit type chips (walk-in dialog). The booking popover has its own chips with minutes.

export function VisitTypeChips({
  items,
  value,
  onPick,
  disabled,
}: {
  items: ListItem[];
  value: string;
  onPick: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="chip-row" role="group" aria-label="Visit type">
      {items.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`pill${v.id === value ? " pill-on" : ""}`}
          aria-pressed={v.id === value}
          disabled={disabled}
          onClick={() => onPick(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
