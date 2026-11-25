import { icons } from "../../../ui/icons";
import { PatientNoChip } from "../../../ui/PatientNoChip";
import type { DoctorModel } from "./doctor-model";

type Props = {
  chair: DoctorModel["chair"];
  spotlight: boolean;
  /** Open visit is running / Done is running (separate, so Done never says Opening). */
  opening: boolean;
  finishing: boolean;
  /** Who is Next, for the empty card's hint. */
  nextName: string | null;
  /** Patients finished today (for the all-done message). */
  done: number;
  /** The doctor is on a break; the time they are back (for the card's text). */
  onBreak: boolean;
  breakBack: string;
  /** Start the Next patient (the card's own button when the chair is free). */
  onStartNext?: () => void;
  onOpenVisit: () => void;
  onDone: () => void;
};

/** "In chair now": exactly one patient (docs/design/final/doctor_today.html "in-chair-card"). */
export function ChairCard({
  chair,
  spotlight,
  opening,
  finishing,
  nextName,
  done,
  onBreak,
  breakBack,
  onStartNext,
  onOpenVisit,
  onDone,
}: Props) {
  const cls = `td-chair${spotlight ? " is-spotlight" : ""}${chair ? "" : " is-empty"}`;
  if (!chair) {
    // The chair is empty for three reasons: the doctor is on a break, patients are waiting outside
    // (nobody sent them in and the doctor has not called them), or everyone has been seen.
    const state = onBreak ? "break" : nextName ? "waiting" : done > 0 ? "finished" : "quiet";
    const TEXT = {
      break: [
        "The chair is free during your break",
        `Back around ${breakBack}. Patients can wait; nothing has moved.`,
      ],
      waiting: [
        "The chair is free",
        `${nextName} is waiting outside. Call them in when you are ready.`,
      ],
      finished: [
        "All patients seen",
        `${done} ${done === 1 ? "patient" : "patients"} seen today. Nothing left in the list. Well done.`,
      ],
      quiet: [
        "The chair is free",
        "Nobody has arrived yet. New patients will appear in the list below.",
      ],
    } as const;
    const [title, line] = TEXT[state];
    return (
      <section id="td-chair" className={`${cls} is-${state}`} aria-label="Current patient in chair">
        <span className="td-free-badge" aria-hidden="true">
          {state === "waiting" ? <span className="td-ripple" /> : null}
          {state === "break" ? (
            <>
              <span className="td-steam-1" />
              <span className="td-steam-2" />
            </>
          ) : null}
          <span className={`td-free-icon${state === "finished" ? " td-draw" : ""}`}>
            {state === "finished" ? icons.taskDone : state === "break" ? icons.coffee : icons.chair}
          </span>
        </span>
        <div className="td-chair-body td-fade" key={state}>
          <span className="td-eyebrow">In chair now</span>
          <h2 className="td-chair-name">{title}</h2>
          <p className="td-chair-meta">{line}</p>
        </div>
        {state === "finished" ? (
          <span className="td-spark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : null}
        {state === "waiting" && onStartNext ? (
          <button
            type="button"
            className="td-btn is-primary td-call"
            disabled={opening || finishing}
            onClick={onStartNext}
          >
            Call {nextName}
          </button>
        ) : null}
      </section>
    );
  }
  return (
    <section id="td-chair" className={cls} aria-label="Current patient in chair">
      <div className="td-chair-body">
        <div className="td-chair-top">
          <span className="td-eyebrow">In chair now</span>
          <span className="td-chair-no">
            <PatientNoChip patientNo={chair.patientCode} />
          </span>
          {chair.alert ? (
            <span className="td-pill td-pill-error">
              <span className="td-ic" aria-hidden="true">
                {icons.warning}
              </span>
              {chair.alert}
            </span>
          ) : null}
        </div>
        <h2 className="td-chair-name">{chair.name}</h2>
        <p className="td-chair-meta">
          {chair.visit.split(" · ")[0]} · In chair since {chair.sinceLabel}
        </p>
      </div>
      <div className="td-chair-actions">
        <button
          type="button"
          className="td-btn td-btn-light"
          disabled={opening || finishing}
          onClick={onOpenVisit}
        >
          {opening ? "Opening…" : "Open visit"}
        </button>
        <button
          type="button"
          className="td-btn td-btn-ghost"
          disabled={opening || finishing}
          onClick={onDone}
        >
          Done
        </button>
      </div>
    </section>
  );
}
