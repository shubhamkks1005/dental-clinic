import { formatRupees } from "@clinic/shared";
import { useEffect, useState } from "react";
import { updateDraftBill, type BillDto, type BillItemDto } from "./api";
import { TextInput } from "../../ui/form";

type DraftLine = {
  key: string;
  procedureLabel: string;
  toothFdi: number | null;
  qty: number;
  unitRupees: string;
  listUnitPaise: number | null;
  visitProcedureId: string | null;
  listItemId: string | null;
  planItemId: string | null;
  feeChangeReason: string;
};

function toLines(items: BillItemDto[]): DraftLine[] {
  return items.map((item, i) => ({
    key: item.id || `new-${i}`,
    procedureLabel: item.procedureLabel,
    toothFdi: item.toothFdi,
    qty: item.qty,
    unitRupees: String(item.unitPaise / 100),
    listUnitPaise: item.listUnitPaise,
    visitProcedureId: item.visitProcedureId,
    listItemId: item.listItemId,
    planItemId: item.planItemId,
    feeChangeReason: item.feeChangeReason ?? "",
  }));
}

/** S09 draft line editor: qty/fee; reason when fee ≠ list. */
export function BillDraftItems({
  bill,
  onUpdated,
  onError,
}: {
  bill: BillDto;
  onUpdated: (bill: BillDto) => void;
  onError: (message: string) => void;
}) {
  const [lines, setLines] = useState(() => toLines(bill.items));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLines(toLines(bill.items));
  }, [bill.id, bill.version]);

  function setLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addCustom() {
    setLines((prev) => [
      ...prev,
      {
        key: `custom-${Date.now()}`,
        procedureLabel: "",
        toothFdi: null,
        qty: 1,
        unitRupees: "0",
        listUnitPaise: null,
        visitProcedureId: null,
        listItemId: null,
        planItemId: null,
        feeChangeReason: "",
      },
    ]);
  }

  async function save() {
    setBusy(true);
    onError("");
    try {
      const items = lines.map((l) => {
        const unitPaise = Math.round(Number(l.unitRupees) * 100);
        return {
          procedureLabel: l.procedureLabel.trim(),
          toothFdi: l.toothFdi,
          qty: l.qty,
          unitPaise,
          listItemId: l.listItemId,
          planItemId: l.planItemId,
          visitProcedureId: l.visitProcedureId,
          listUnitPaise: l.listUnitPaise,
          feeChangeReason: l.feeChangeReason.trim() || null,
        };
      });
      const next = await updateDraftBill(bill.id, { version: bill.version, items });
      onUpdated(next);
      setLines(toLines(next.items));
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Could not save bill lines.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack gap-sm" aria-label="Bill lines">
      <ul className="stack gap-sm list-plain">
        {lines.map((line) => {
          const unitPaise = Math.round(Number(line.unitRupees) * 100);
          const needsReason =
            line.listUnitPaise != null &&
            Number.isFinite(unitPaise) &&
            unitPaise !== line.listUnitPaise;
          return (
            <li key={line.key} className="stack gap-xs surface card-pad">
              <label className="stack gap-xs">
                <span className="muted small">Item</span>
                <TextInput
                  value={line.procedureLabel}
                  onChange={(e) => setLine(line.key, { procedureLabel: e.target.value })}
                  style={{ minHeight: 44 }}
                />
              </label>
              <div className="row wrap gap-sm">
                <label className="stack gap-xs">
                  <span className="muted small">Qty</span>
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={99}
                    value={line.qty}
                    onChange={(e) => setLine(line.key, { qty: Number(e.target.value) || 1 })}
                    style={{ minHeight: 44, width: 72 }}
                  />
                </label>
                <label className="stack gap-xs">
                  <span className="muted small">Fee (₹)</span>
                  <TextInput
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="1"
                    value={line.unitRupees}
                    onChange={(e) => setLine(line.key, { unitRupees: e.target.value })}
                    style={{ minHeight: 44, width: 120 }}
                  />
                </label>
                {line.listUnitPaise != null ? (
                  <p className="muted small" style={{ alignSelf: "end" }}>
                    List {formatRupees(line.listUnitPaise)}
                  </p>
                ) : null}
              </div>
              {needsReason ? (
                <label className="stack gap-xs">
                  <span className="muted small">Reason for fee change</span>
                  <TextInput
                    value={line.feeChangeReason}
                    onChange={(e) => setLine(line.key, { feeChangeReason: e.target.value })}
                    placeholder="Required when fee differs from list"
                    style={{ minHeight: 44 }}
                  />
                </label>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="row wrap gap-sm">
        <button type="button" className="btn secondary" disabled={busy} onClick={addCustom}>
          Add item
        </button>
        <button type="button" className="btn secondary" disabled={busy} onClick={() => void save()}>
          Save lines
        </button>
      </div>
    </div>
  );
}
