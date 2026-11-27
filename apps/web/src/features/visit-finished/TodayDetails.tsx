import { formatClockTime, formatDisplayDate } from "@clinic/shared";
import { useState, type ReactNode } from "react";
import type { VisitAfterDto } from "./api";
import { AddendaBlock } from "./AddendaBlock";
import type { Part } from "./useVisitFinished";
import { VfIcon } from "./vf-icons";

type Props = {
  after: Part<VisitAfterDto>;
  visitId: string;
  addendaOpen: boolean;
  setAddendaOpen: (open: boolean) => void;
  toast: (text: string) => void;
  onRetry: () => void;
  children?: ReactNode;
};

const SHOWN = 5;

// Today's details (HTML 524-612): what the prescription does not say. Names only, no fees.
export function TodayDetails({
  after,
  visitId,
  addendaOpen,
  setAddendaOpen,
  toast,
  onRetry,
  children,
}: Props) {
  return (
    <section className="vf-col" aria-labelledby="vf-det-h">
      <div className="vf-bar">
        <h2 id="vf-det-h" className="vf-h2">
          Today&apos;s details
        </h2>
        <span className="vf-muted">Not on prescription</span>
      </div>
      {after.state === "loading" && (
        <div className="vf-card vf-skel-box" aria-busy="true">
          <div className="vf-skel" style={{ height: 48 }} />
          <div className="vf-skel" style={{ height: 64 }} />
          <div className="vf-skel" style={{ height: 56 }} />
        </div>
      )}
      {after.state === "error" && (
        <div className="vf-error-line" role="alert">
          <VfIcon name="error" />
          <span>Could not load today&apos;s details.</span>
          <button type="button" className="vf-btn vf-btn-small" onClick={onRetry}>
            <VfIcon name="refresh" /> Retry
          </button>
        </div>
      )}
      {after.state === "ok" && (
        <div className="vf-card vf-details">
          <Details a={after.data} />
          <AddendaBlock
            visitId={visitId}
            open={addendaOpen}
            setOpen={setAddendaOpen}
            toast={toast}
          />
        </div>
      )}
      {children}
    </section>
  );
}

function Details({ a }: { a: VisitAfterDto }) {
  const empty =
    !a.diagnoses.length &&
    !a.procedures.length &&
    !a.openPlanItems.length &&
    !a.nextAppointment &&
    !a.followUpOn &&
    !a.filesAdded.length;
  if (empty) return <p className="vf-muted">Nothing else recorded for today.</p>;
  return (
    <>
      <List
        title="Diagnoses"
        items={a.diagnoses.map((d) => [d.id, d.label, tooth(d.toothFdi, true)])}
      />
      <List
        title="Procedures done"
        items={a.procedures.map((p) => [
          p.id,
          p.surfaces.length ? `${p.label} (${p.surfaces.join("").toUpperCase()})` : p.label,
          tooth(p.toothFdi),
        ])}
      />
      <List
        title="Open plan items"
        items={a.openPlanItems.map((p) => [
          p.id,
          `${p.procedureLabel}${p.toothFdi ? ` #${p.toothFdi}` : ""}`,
          <span
            key="s"
            className={`vf-pill ${p.sittingsDone > 0 ? "vf-pill-info" : "vf-pill-plain"}`}
          >
            {p.sittingsDone > 0 ? `${p.sittingsDone} / ${p.sittings} sittings` : "Planned"}
          </span>,
        ])}
      />
      {(a.nextAppointment || a.followUpOn) && (
        <div className="vf-det-two">
          {a.nextAppointment && (
            <div>
              <span className="vf-muted">Next appointment</span>
              <strong>
                {formatDisplayDate(a.nextAppointment.dateLocal).replaceAll("/", "-")} ·{" "}
                {formatClockTime(a.nextAppointment.startMin).toLowerCase()}
              </strong>
            </div>
          )}
          {a.followUpOn && (
            <div>
              <span className="vf-muted">Follow-up date</span>
              <strong>{formatDisplayDate(a.followUpOn).replaceAll("/", "-")}</strong>
            </div>
          )}
        </div>
      )}
      {a.filesAdded.length > 0 && (
        <div className="vf-det-part">
          <span className="vf-label">Files added today</span>
          <div className="vf-row">
            {a.filesAdded.map((f) => (
              <span key={f.id} className="vf-file vf-mono">
                <VfIcon name="file" /> {f.originalFilename}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function tooth(fdi: number | null, chip = false) {
  if (!fdi) return null;
  return <span className={chip ? "vf-tooth-chip vf-mono" : "vf-mono vf-muted"}>#{fdi}</span>;
}

function List({ title, items }: { title: string; items: [string, string, ReactNode][] }) {
  const [all, setAll] = useState(false);
  if (items.length === 0) return null;
  const shown = all ? items : items.slice(0, SHOWN);
  return (
    <div className="vf-det-part">
      <span className="vf-label">{title}</span>
      <ul className="vf-det-list">
        {shown.map(([id, label, end]) => (
          <li key={id}>
            <span>{label}</span>
            {end}
          </li>
        ))}
      </ul>
      {items.length > SHOWN && (
        <button type="button" className="vf-link" onClick={() => setAll(!all)}>
          {all ? "Show less" : `Show all ${items.length}`}
        </button>
      )}
    </div>
  );
}
