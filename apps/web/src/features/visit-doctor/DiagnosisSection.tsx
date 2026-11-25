import { useMemo } from "react";
import { filterOptions, type SearchOption } from "./lines-model";
import { LineSearch } from "./LineSearch";
import { ToothInput } from "./LineBits";
import type { VisitLines } from "./useVisitLines";

type Props = {
  lines: VisitLines;
  options: SearchOption[];
  done: boolean;
  readOnly: boolean;
};

/** Part A of Accordion 2: diagnoses. Own list or free text; a tooth is optional. */
export function DiagnosisSection({ lines, options, done, readOnly }: Props) {
  const { diagnoses, noDiagnosis, diagnosis } = lines;
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  return (
    <section className="vd-sec" aria-labelledby="vd-dx-title">
      <div className="vd-sec-head">
        <div className="vd-sec-title">
          <h3 id="vd-dx-title">Diagnoses</h3>
          <span className={`vd-pill ${done ? "vd-pill-success" : "vd-pill-warning"}`}>
            {done ? "Diagnosis done ✓" : "Diagnosis missing"}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            className={`vd-small-btn${noDiagnosis ? " is-on" : ""}`}
            aria-pressed={noDiagnosis}
            onClick={diagnosis.toggleNone}
          >
            No diagnosis for this visit
          </button>
        )}
      </div>

      {!readOnly && (
        <LineSearch
          placeholder="Search diagnosis (or type new)"
          items={(text) => filterOptions(options, text).map((o) => ({ id: o.id, label: o.label }))}
          onPick={(item) => diagnosis.add(item.label, byId.get(item.id)?.id ?? item.id)}
          onEnterFreeText={(text) => diagnosis.add(text, null)}
          empty={(text, done) =>
            text ? (
              <button
                type="button"
                className="vd-opt is-active"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  diagnosis.add(text, null);
                  done();
                }}
              >
                <span>Add &ldquo;{text}&rdquo; as free text</span>
                <span className="vd-opt-note">Enter</span>
              </button>
            ) : (
              <span className="vd-menu-plain">Type any diagnosis to add.</span>
            )
          }
        />
      )}

      <div className="vd-lines">
        {diagnoses.length === 0 ? (
          noDiagnosis ? (
            <div className="vd-empty is-solid">No diagnosis for this visit.</div>
          ) : (
            <div className="vd-empty">No diagnosis yet. Search and press Enter to add.</div>
          )
        ) : (
          diagnoses.map((d) => (
            <div className="vd-line" key={d.key} data-line="diagnosis">
              <div className="vd-line-top">
                <div className="vd-line-name">
                  <span>{d.label}</span>
                  {!d.fromList && <span className="vd-tag">Free text</span>}
                </div>
                <div className="vd-line-side">
                  <ToothInput
                    value={d.toothFdi}
                    disabled={readOnly}
                    label={d.label}
                    onChange={(fdi) => diagnosis.setTooth(d.key, fdi)}
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      className="vd-remove"
                      aria-label={`Remove ${d.label}`}
                      onClick={() => diagnosis.remove(d.key)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
