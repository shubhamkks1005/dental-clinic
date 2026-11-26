import { resolveSetMedicines, type ListItem } from "@clinic/shared";
import { useState } from "react";
import { TextInput } from "../../ui/form";
import type { Draft } from "./library-draft";
import { SuggestBox } from "./SuggestBox";

const MISSING = "missing:";

/** Older sets keep names only: fill the ids from active medicines with that name (P5.6.3). */
export function withSetIds(draft: Draft, medicines: readonly ListItem[]): Draft {
  if ((draft.data.item_ids ?? "").trim() || !(draft.data.items ?? "").trim()) return draft;
  const resolved = resolveSetMedicines(draft, medicines);
  const ids = resolved.map((r) => r.medicine?.id ?? `${MISSING}${r.name}`);
  return { ...draft, data: { ...draft.data, item_ids: ids.join("|") } };
}

/** Save is allowed only when every medicine of the set is an active Library medicine (Q12). */
export function setProblem(draft: Draft, medicines: readonly ListItem[]): string | null {
  const resolved = resolveSetMedicines(draft, medicines);
  if (resolved.length === 0) return "A set needs at least one medicine.";
  if (resolved.some((r) => r.problem !== "ok"))
    return "Remove the hidden or missing medicines first (the x on each).";
  return null;
}

type Props = {
  draft: Draft;
  onDraft: (d: Draft) => void;
  medicines: readonly ListItem[];
  /** "Add it to Medicines first": opens the medicine form; resolves with the new medicine. */
  onNewMedicine: (name: string) => Promise<ListItem | null>;
  autoFocus: boolean;
};

// Q3 / Q6: a set is a list of Library medicines (ids + current names), picked from ACTIVE ones.
export function SetForm({ draft, onDraft, medicines, onNewMedicine, autoFocus }: Props) {
  const [find, setFind] = useState("");
  const resolved = resolveSetMedicines(draft, medicines);
  const ids = (draft.data.item_ids ?? "").split("|").filter(Boolean);
  const write = (next: { id: string; name: string }[]) =>
    onDraft({
      ...draft,
      data: {
        ...draft.data,
        items: next.map((e) => e.name).join("|"),
        item_ids: next.map((e) => e.id).join("|"),
      },
    });
  const entries = resolved.map((r, i) => ({ id: ids[i] ?? `${MISSING}${r.name}`, name: r.name }));
  const q = find.trim().toLowerCase();
  const offer = q
    ? medicines
        .filter((m) => m.active && !ids.includes(m.id) && m.label.toLowerCase().includes(q))
        .slice(0, 8)
    : [];
  const add = (m: ListItem) => {
    write([...entries, { id: m.id, name: m.label }]);
    setFind("");
  };

  return (
    <>
      <SuggestBox
        label="Set name"
        field={null}
        value={draft.label}
        autoFocus={autoFocus}
        placeholder="e.g. After extraction"
        onChange={(label) => onDraft({ ...draft, label })}
      />
      <div className="ld-field">
        <span>Medicines</span>
        <div className="ld-chips ld-picker-chips">
          {resolved.map((r, i) => (
            <span
              key={`${entries[i]!.id}-${i}`}
              className={`ld-chip${r.problem === "ok" ? "" : " bad"}`}
            >
              {r.name}
              {r.problem === "hidden"
                ? " (Hidden)"
                : r.problem === "missing"
                  ? " (Not in your list)"
                  : ""}
              <button
                type="button"
                aria-label={`Remove ${r.name}`}
                onClick={() => write(entries.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </span>
          ))}
          {resolved.length === 0 ? <span className="ld-note">No medicines yet.</span> : null}
        </div>
      </div>
      <label className="ld-field">
        <span>Add a medicine</span>
        <TextInput
          className="ld-input"
          type="search"
          value={find}
          placeholder="Search your medicines..."
          onChange={(e) => setFind(e.target.value)}
        />
      </label>
      {q ? (
        <div className="ld-chips" role="group" aria-label="Matching medicines">
          {offer.map((m) => (
            <button key={m.id} type="button" className="ld-action" onClick={() => add(m)}>
              + {m.label}
              {m.data.strength ? ` · ${String(m.data.strength)}` : ""}
            </button>
          ))}
          {offer.length === 0 ? (
            <button
              type="button"
              className="ld-action"
              onClick={() =>
                void onNewMedicine(find.trim()).then((m) => {
                  if (m) add(m);
                })
              }
            >
              Add it to Medicines first
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
