import { firstPage } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listPatients, type PatientListRow } from "../patients";
import { TextInput } from "../../ui/form";

type Props = {
  selected: PatientListRow | null;
  onSelect: (p: PatientListRow) => void;
  onClear: () => void;
};

export function QuickBookPatient({ selected, onSelect, onClear }: Props) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PatientListRow[]>([]);

  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed || selected) {
      setRows([]);
      return;
    }
    const t = window.setTimeout(() => {
      listPatients({ ...firstPage("full_name"), q: trimmed, pageSize: 6 })
        .then((page) => setRows(page.rows))
        .catch(() => setRows([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [q, selected]);

  if (selected) {
    return (
      <div className="quick-book-picked">
        <span>
          {selected.fullName} · {selected.code}
        </span>
        <button type="button" className="btn btn-compact" onClick={onClear}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="quick-book-search">
      <label>
        Patient
        <TextInput
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, mobile, or patient no."
          autoComplete="off"
        />
      </label>
      {rows.length > 0 ? (
        <ul className="quick-book-results" role="listbox">
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" className="quick-book-result" onClick={() => onSelect(r)}>
                <span>{r.fullName}</span>
                <span className="small muted">{r.code}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {q.trim() && rows.length === 0 ? (
        <p className="small muted">
          Not found? <Link to="/app/patients/new">New patient</Link>
        </p>
      ) : null}
    </div>
  );
}
