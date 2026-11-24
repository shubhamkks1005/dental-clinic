import { icons } from "../../ui/icons";
import "../today/doctor/doctor-tokens.css";

// T2.1: the doctor's Today colours and pills in one place (development only, /app/style-guide).
const PILLS: [string, string][] = [
  ["td-pill-info", "Visit in progress"],
  ["td-pill-warning", "Waiting 12 min"],
  ["td-pill-success", "Done"],
  ["td-pill-error", "Late"],
  ["td-pill-neutral", "Stepped out"],
  ["td-pill-primary", "Next"],
  ["td-pill-cancelled", "Cancelled"],
];

export function DoctorTodayDemo() {
  return (
    <section className="card guide-card today-doc" aria-labelledby="g-doctor-today">
      <h2 id="g-doctor-today">Doctor Today (final design)</h2>
      <p className="small muted">Colours and pills used on the doctor's Today page only.</p>
      <div className="guide-row">
        {PILLS.map(([cls, text]) => (
          <span key={cls} className={`td-pill ${cls}`}>
            <span className="td-dot" aria-hidden="true" />
            {text}
          </span>
        ))}
      </div>
      <div className="guide-row">
        {(["coffee", "warning", "sync", "walk", "personOff", "eventRepeat", "cancel"] as const).map(
          (name) => (
            <span key={name} title={name}>
              {icons[name]}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
