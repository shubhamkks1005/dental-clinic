import type { Doctor } from "@clinic/shared";
import { Checkbox } from "../../ui/form";
import { doctorVars } from "../../ui/DoctorBadge";
import { CalIcon } from "./CalIcon";

// Doctor filter (HTML 247, desk only, P5.2): one tick chip per active doctor, All | Clear.
// The filter is on screen only; the server already sends a doctor only their own rows.
export function DoctorFilter({
  doctors,
  chosen,
  onChange,
}: {
  doctors: Doctor[];
  chosen: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  if (doctors.length === 0) return null;
  return (
    <div className="cal-filter" role="group" aria-label="Doctors shown">
      <div className="cal-filter-left">
        <span className="cal-filter-label">
          <CalIcon name="groups" />
          <span>Doctors:</span>
        </span>
        {doctors.map((d) => (
          <label key={d.id} className="cal-doc-chip" style={doctorVars(d)}>
            <Checkbox
              checked={chosen.has(d.id)}
              onChange={(e) => {
                const next = new Set(chosen);
                if (e.target.checked) next.add(d.id);
                else next.delete(d.id);
                onChange(next);
              }}
            />
            <span className="cal-dot" aria-hidden="true" />
            <span>{d.name}</span>
            {d.specialty ? <small>({d.specialty})</small> : null}
          </label>
        ))}
      </div>
      <div className="cal-filter-left">
        <button
          type="button"
          className="cal-link"
          onClick={() => onChange(new Set(doctors.map((d) => d.id)))}
        >
          All
        </button>
        <span className="cal-filter-sep" aria-hidden="true">
          |
        </span>
        <button
          type="button"
          className="cal-link cal-link-quiet"
          onClick={() => onChange(new Set())}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
