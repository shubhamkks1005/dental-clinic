import { MEDICINE_TIMING_LABEL } from "@clinic/shared";
import {
  LIST_DEFS,
  type ListDef,
  type ListItem,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { useState } from "react";
import { StatusBadge } from "../../ui/StatusBadge";
import { ItemForm } from "./ItemForm";

type Props = {
  listKey: ListKey;
  item: ListItem;
  canEdit: boolean;
  first: boolean;
  last: boolean;
  busy: boolean;
  onSave: (input: ListItemInput) => Promise<boolean>;
  onActive: (active: boolean) => void;
  onMove: (direction: "up" | "down") => void;
};

// One item: name, its own fields, status, and (for the doctor) edit, move and hide/show.
/** "after_food" is a stored token, never a screen word. */
const plainWord = (v: string): string =>
  (MEDICINE_TIMING_LABEL as Record<string, string>)[v] ??
  (/^[a-z]+(_[a-z]+)+$/.test(v) ? v.replaceAll("_", " ") : v);

export function ItemRow({
  listKey,
  item,
  canEdit,
  first,
  last,
  busy,
  onSave,
  onActive,
  onMove,
}: Props) {
  const [editing, setEditing] = useState(false);
  const def: ListDef = LIST_DEFS[listKey];
  const details = def.fields
    .map((f) => {
      const v = item.data[f.name];
      if (f.kind === "number") return `${v ?? "-"} ${f.suffix}`;
      if (f.kind === "text" && !f.hidden && v) return plainWord(String(v));
      return null;
    })
    .filter(Boolean)
    .join(" · ");
  const colour = def.fields.some((f) => f.kind === "colour") ? String(item.data.color ?? "") : "";

  if (editing) {
    return (
      <li className="item-row item-row-editing">
        <ItemForm
          listKey={listKey}
          initial={{ label: item.label, data: item.data }}
          submitLabel="Save"
          onSubmit={async (input) => {
            const saved = await onSave(input);
            if (saved) setEditing(false);
            return saved;
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className={item.active ? "item-row" : "item-row item-row-hidden"}>
      <div className="item-text">
        {colour && (
          <span
            className="item-colour-swatch"
            style={{ backgroundColor: colour }}
            title={colour}
            aria-hidden
          />
        )}
        <span className="item-label">{item.label}</span>
        {details && <span className="small muted">{details}</span>}
      </div>
      {!item.active && <StatusBadge tone="upcoming" label="Hidden" />}
      {canEdit && (
        <div className="item-actions">
          <button
            type="button"
            className="btn btn-compact"
            disabled={busy}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-compact"
            aria-label={`Move ${item.label} up`}
            disabled={busy || first}
            onClick={() => onMove("up")}
          >
            ↑
          </button>
          <button
            type="button"
            className="btn btn-compact"
            aria-label={`Move ${item.label} down`}
            disabled={busy || last}
            onClick={() => onMove("down")}
          >
            ↓
          </button>
          <button
            type="button"
            className="btn btn-compact"
            disabled={busy}
            onClick={() => onActive(!item.active)}
          >
            {item.active ? "Hide" : "Show"}
          </button>
        </div>
      )}
    </li>
  );
}
