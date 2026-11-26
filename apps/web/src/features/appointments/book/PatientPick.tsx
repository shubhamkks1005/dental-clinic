import { displayMobile, firstPage } from "@clinic/shared";
import { useEffect, useState, type Ref } from "react";
import { NativeInput } from "../../../ui/form";
import { listPatients } from "../../patients";
import { CalIcon } from "../CalIcon";
import type { PickedPatient } from "./useBookDraft";

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .slice(0, 2)
    .join("") || "?";

// HTML 549-572: the chosen patient as a docked box with "Change", or the search input.
export function PatientPick({
  patient,
  locked,
  hidden,
  boxRef,
  searchRef,
  onPick,
  onNew,
}: {
  patient: PickedPatient | null;
  locked: boolean;
  /** Save & Book: the real box waits under the flyer until it docks (M19). */
  hidden: boolean;
  boxRef: Ref<HTMLDivElement>;
  searchRef: Ref<HTMLInputElement>;
  onPick: (p: PickedPatient | null) => void;
  onNew: (() => void) | null;
}) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PickedPatient[]>([]);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2 || patient) {
      setRows([]);
      return;
    }
    let current = true;
    const t = window.setTimeout(() => {
      listPatients({ ...firstPage("full_name"), q: text, pageSize: 6 })
        .then(
          (page) =>
            current &&
            setRows(
              page.rows
                .filter((r) => r.status === "active")
                .map((r) => ({ id: r.id, code: r.code, fullName: r.fullName, mobile: r.mobile })),
            ),
        )
        .catch(() => current && setRows([]));
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(t);
    };
  }, [q, patient]);

  return (
    <div className="bk-field">
      <div className="bk-label bk-label-row">
        <span>
          Patient Profile <span className="bk-req">*</span>
        </span>
        {onNew ? (
          <button type="button" className="bk-text-link" onClick={onNew}>
            + Register New Patient
          </button>
        ) : null}
      </div>
      {patient ? (
        <div
          ref={boxRef}
          className="bk-picked"
          style={{ opacity: hidden ? 0 : 1 }}
          data-testid="bk-picked"
        >
          <div className="bk-picked-left">
            <span className="cal-initials">{initialsOf(patient.fullName)}</span>
            <div className="bk-picked-who">
              <span className="bk-picked-line">
                <span className="bk-picked-name">{patient.fullName}</span>
                <span className="cal-code-chip">{patient.code}</span>
              </span>
              <span className="bk-picked-mobile">
                {patient.mobile ? `+91 ${displayMobile(patient.mobile)}` : "No mobile"}
              </span>
            </div>
          </div>
          {locked ? null : (
            <button type="button" className="bk-change" onClick={() => onPick(null)}>
              Change
            </button>
          )}
        </div>
      ) : (
        <div className="bk-search">
          <CalIcon name="search" className="bk-search-icon" />
          <NativeInput
            ref={searchRef}
            className="bk-input bk-search-input"
            placeholder="Search patient name, code or phone..."
            aria-label="Search patient name, code or phone"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {rows.length > 0 ? (
            <ul className="bk-results" role="listbox" aria-label="Matching patients">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      setQ("");
                      onPick(r);
                    }}
                  >
                    <span className="bk-picked-name">{r.fullName}</span>
                    <span className="bk-result-sub">
                      {r.code}
                      {r.mobile ? ` · ${displayMobile(r.mobile)}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : q.trim().length >= 2 ? (
            <p className="bk-hint">No patient found. Use + Register New Patient.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
