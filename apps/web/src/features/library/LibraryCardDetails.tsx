import {
  istDateTime,
  resolveSetMedicines,
  visitColourName,
  type ListItem,
  type ListKey,
} from "@clinic/shared";
import { MORE_LISTS } from "./LibraryTabs";
import { feeLine, medicineLine, text, timingWord, visitTypeLine, type Usage } from "./library-view";

const when = (iso?: string) => (iso ? istDateTime(new Date(iso)) : "-");

type LineProps = {
  listKey: ListKey;
  item: ListItem;
  usage: Usage | null;
  twin: boolean;
  medicines: readonly ListItem[] | null;
};

// HTML 959-972: the one detail line under the name, per list.
export function CardLine({ listKey, item, usage, twin, medicines }: LineProps) {
  if (listKey === "medicines") return <p className="ld-line">{medicineLine(item, usage, twin)}</p>;
  if (listKey === "medicine_sets") {
    const resolved = resolveSetMedicines(item, medicines ?? []);
    const broken = medicines !== null && resolved.some((r) => r.problem !== "ok");
    return (
      <>
        <div className="ld-chips">
          {resolved.map((r, i) => (
            <span key={`${r.name}-${i}`} className={`ld-chip${r.problem === "ok" ? "" : " bad"}`}>
              {r.name}
              {r.problem === "hidden"
                ? " (Hidden)"
                : r.problem === "missing"
                  ? " (Not in your list)"
                  : ""}
            </span>
          ))}
        </div>
        {broken && item.active ? (
          <p className="ld-warn-line">
            Not offered in visits until fixed. Edit the set to remove it.
          </p>
        ) : null}
      </>
    );
  }
  if (listKey === "procedures")
    return (
      <p className="ld-line">
        <span className="ld-mono">{text(item, "code") || "-"}</span> |{" "}
        <strong>{feeLine(item)}</strong>
      </p>
    );
  if (listKey === "visit_types")
    return (
      <p className="ld-line">
        <span
          className="ld-swatch"
          aria-hidden="true"
          style={{ background: text(item, "color") || "transparent" }}
        />
        {visitTypeLine(item)}
      </p>
    );
  if (listKey === "quick_phrases") return <p className="ld-line ld-clamp">{text(item, "text")}</p>;
  if (MORE_LISTS.includes(listKey)) {
    const code = text(item, "code") || text(item, "tag");
    const restricted = text(item, "restricted") === "yes";
    if (!code && !restricted) return null;
    return (
      <p className="ld-line">
        {code ? <span className="ld-mono">{code}</span> : null}
        {restricted ? `${code ? " · " : ""}Restricted` : null}
      </p>
    );
  }
  return null;
}

// HTML 986-1008. Medicines: Salt, Brand, Timing, Days (Q1 drops the rest; L16: no invented
// "After food"). Other lists (Q11): who created it, when, and when it was last changed.
export function CardDetails({ listKey, item }: { listKey: ListKey; item: ListItem }) {
  const row = (label: string, value: string, wide = false) => (
    <div className={wide ? "wide" : undefined}>
      <dt>{label}:</dt>
      <dd>{value || "-"}</dd>
    </div>
  );
  if (listKey === "medicines")
    return (
      <dl className="ld-details" onClick={(e) => e.stopPropagation()}>
        {row("Salt", text(item, "salt"))}
        {row("Brand", text(item, "brand"))}
        {row("Timing", timingWord(item))}
        {row("Days", text(item, "default_days"))}
      </dl>
    );
  return (
    <dl className="ld-details" onClick={(e) => e.stopPropagation()}>
      {row("Created by", item.createdByName ?? "-")}
      {row("Created on", when(item.createdAt))}
      {row(
        "Last updated",
        item.updatedAt ? `${when(item.updatedAt)} by ${item.updatedByName ?? "-"}` : "-",
      )}
      {listKey === "quick_phrases" ? row("Full text", text(item, "text"), true) : null}
      {listKey === "visit_types" ? row("Colour", visitColourName(text(item, "color"))) : null}
    </dl>
  );
}
