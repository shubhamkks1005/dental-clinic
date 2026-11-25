import { useMemo, useState } from "react";
import { NativeInput } from "../../ui/form";
import {
  filterOptions,
  hasDuplicateProcedure,
  planTag,
  rupeesToPaise,
  type SearchOption,
} from "./lines-model";
import { LineSearch } from "./LineSearch";
import { SurfaceButtons, ToothInput } from "./LineBits";
import type { PagePlanItem } from "./page-api";
import type { VisitLines } from "./useVisitLines";

type Props = {
  lines: VisitLines;
  options: SearchOption[];
  plan: PagePlanItem[];
  done: boolean;
  readOnly: boolean;
};

/** Not in the list: name and fee go to the doctor's list, then the line is added at once. */
function InlineAdd({
  name,
  onAdd,
}: {
  name: string;
  onAdd: (name: string, paise: number) => Promise<boolean>;
}) {
  const [fee, setFee] = useState("");
  const [bad, setBad] = useState(false);
  async function go() {
    const paise = rupeesToPaise(fee);
    setBad(paise === null);
    if (paise !== null) await onAdd(name, paise);
  }
  return (
    <div className="vd-inline-add">
      <strong>Not in your procedures list</strong>
      <span className="vd-hint">
        Free text is not allowed for procedures because billing uses list fees.
      </span>
      <div className="vd-inline-add-row">
        <NativeInput
          className="vd-fee-input"
          type="text"
          inputMode="decimal"
          placeholder="Fee (Rs)"
          aria-label={`Fee in rupees for ${name}`}
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void go();
            }
          }}
        />
        <button type="button" className="vd-primary-btn" onClick={() => void go()}>
          Add to my list
        </button>
      </div>
      {bad && (
        <span role="alert" className="vd-hint">
          Enter the usual fee in rupees, for example 1200.
        </span>
      )}
    </div>
  );
}

/** Part B of Accordion 2: procedures done today (own list only, no free text). */
export function ProcedureSection({ lines, options, plan, done, readOnly }: Props) {
  const { procedures, noProcedure, procedure } = lines;
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const duplicate = hasDuplicateProcedure(procedures);

  return (
    <section className="vd-sec" aria-labelledby="vd-pr-title">
      <div className="vd-sec-head">
        <div className="vd-sec-title">
          <h3 id="vd-pr-title">Procedures done today</h3>
          <span className={`vd-pill ${done ? "vd-pill-success" : "vd-pill-warning"}`}>
            {done ? "Procedures done ✓" : "Procedures missing"}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            className={`vd-small-btn${noProcedure ? " is-on" : ""}`}
            aria-pressed={noProcedure}
            onClick={procedure.toggleNone}
          >
            No procedure for this visit
          </button>
        )}
      </div>

      {!readOnly && (
        <LineSearch
          placeholder="Search procedure or code"
          items={(text) =>
            filterOptions(options, text).map((o) => ({
              id: o.id,
              label: o.label,
              code: o.code,
              note: o.paise === null ? "No fee set" : undefined,
            }))
          }
          onPick={(item) => {
            const o = byId.get(item.id);
            if (o) procedure.add(o.id, o.label, o.paise === null);
          }}
          empty={(text, close) =>
            text ? (
              <InlineAdd
                name={text}
                onAdd={async (name, paise) => {
                  const ok = await procedure.addInline(name, paise);
                  if (ok) close();
                  return ok;
                }}
              />
            ) : (
              <span className="vd-menu-plain">No procedures in your list yet.</span>
            )
          }
        />
      )}

      {duplicate && (
        <div className="vd-notice" role="status">
          Same procedure appears twice on the same tooth in this visit.
        </div>
      )}

      <div className="vd-lines">
        {procedures.length === 0 ? (
          noProcedure ? (
            <div className="vd-empty is-solid">No procedure for this visit.</div>
          ) : (
            <div className="vd-empty">No procedure yet.</div>
          )
        ) : (
          procedures.map((p) => {
            const tag = planTag(p, plan);
            return (
              <div className="vd-line" key={p.key} data-line="procedure">
                <div className="vd-line-top">
                  <div className="vd-line-name">
                    <span>{p.label}</span>
                    {tag && <span className="vd-pill vd-pill-info">{tag}</span>}
                    {p.noFee && <span className="vd-pill vd-pill-warning">No fee set</span>}
                  </div>
                  <div className="vd-line-side">
                    {!readOnly && (
                      <button
                        type="button"
                        className="vd-remove"
                        aria-label={`Remove ${p.label}`}
                        onClick={() => procedure.remove(p.key)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="vd-line-tools">
                  <ToothInput
                    value={p.toothFdi}
                    disabled={readOnly}
                    label={p.label}
                    onChange={(fdi) => procedure.setTooth(p.key, fdi)}
                  />
                  <SurfaceButtons
                    value={p.surfaces}
                    disabled={readOnly}
                    onToggle={(s) => procedure.toggleSurface(p.key, s)}
                  />
                  <NativeInput
                    className="vd-note"
                    type="text"
                    maxLength={1000}
                    placeholder="Short note (e.g. sitting 1 of 3)"
                    aria-label={`Note for ${p.label}`}
                    disabled={readOnly}
                    value={p.note}
                    onChange={(e) => procedure.setNote(p.key, e.target.value)}
                    onBlur={(e) => procedure.setNote(p.key, e.target.value, true)}
                  />
                  <label className="vd-sittings">
                    <NativeInput
                      type="checkbox"
                      disabled={readOnly}
                      checked={p.moreSittings}
                      onChange={(e) => procedure.setMoreSittings(p.key, e.target.checked)}
                    />
                    <span>Needs more sittings</span>
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
