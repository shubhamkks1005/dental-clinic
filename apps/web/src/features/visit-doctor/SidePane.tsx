import { formatClockTime, formatDisplayDate, formatRupees } from "@clinic/shared";
import { Link } from "react-router";
import type { ReactNode } from "react";
import type { VisitPageData } from "./page-api";

export type SideTab = "rx" | "history";

type Props = {
  tab: SideTab;
  onTab: (tab: SideTab) => void;
  page: VisitPageData;
  patientId: string;
  /** The live prescription sheet (tab 1). */
  rx: ReactNode;
  paneRef?: React.RefObject<HTMLElement | null>;
  handles?: {
    corner: React.HTMLAttributes<HTMLElement>;
    down: React.HTMLAttributes<HTMLElement>;
  };
};

/** Right pane: the live prescription (next step) and the patient's History from the one page read. */
export function SidePane({ tab, onTab, page, patientId, rx, paneRef, handles }: Props) {
  return (
    <aside
      className="vd-side"
      aria-label="Prescription and history"
      ref={paneRef as React.RefObject<HTMLElement>}
    >
      <div className="vd-tabs" role="tablist" aria-label="Side pane">
        {(
          [
            ["rx", "Live A4 Rx"],
            ["history", "History"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`vd-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`vd-panel-${id}`}
            className={`vd-tab${tab === id ? " is-on" : ""}`}
            onClick={() => onTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "rx" ? (
        <div className="vd-panel" role="tabpanel" id="vd-panel-rx" aria-labelledby="vd-tab-rx">
          {rx}
        </div>
      ) : (
        <div
          className="vd-panel"
          role="tabpanel"
          id="vd-panel-history"
          aria-labelledby="vd-tab-history"
        >
          <HistoryBlocks page={page} patientId={patientId} />
        </div>
      )}
      {handles && (
        <>
          <div
            className="vd-resize-bottom"
            title="Drag vertically to resize height"
            {...handles.down}
          />
          <div
            className="vd-resize-corner"
            title="Drag diagonally to resize width and height (double-click to reset)"
            {...handles.corner}
          />
        </>
      )}
    </aside>
  );
}

function HistoryBlocks({ page, patientId }: { page: VisitPageData; patientId: string }) {
  const next = page.nextAppointment;
  const pending = page.openPlanItems;
  const meds = page.previousMedicines;
  return (
    <>
      <section className="vd-block">
        <h3>Dues</h3>
        {page.duesPaise > 0 ? (
          <p>
            <strong>{formatRupees(page.duesPaise)}</strong> is due on earlier bills.
          </p>
        ) : (
          <p className="vd-hint">Nothing due.</p>
        )}
      </section>

      <section className="vd-block">
        <h3>Next appointment</h3>
        {next ? (
          <p>
            {formatDisplayDate(next.dateLocal)} · {formatClockTime(next.startMin)} ·{" "}
            {next.visitTypeLabel}
          </p>
        ) : (
          <p className="vd-hint">None booked.</p>
        )}
      </section>

      <section className="vd-block">
        <h3>Pending treatment</h3>
        {pending.length === 0 ? (
          <p className="vd-hint">Nothing pending.</p>
        ) : (
          <ul className="vd-list">
            {pending.map((p) => {
              const left = Math.max(0, p.sittings - p.sittingsDone);
              return (
                <li key={p.id}>
                  {p.procedureLabel}
                  {p.toothFdi ? ` (${p.toothFdi})` : ""}
                  {p.sittings > 1 && (
                    <span className="vd-hint">
                      {" "}
                      · {left} {left === 1 ? "sitting" : "sittings"} remaining
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="vd-block">
        <h3>Previous medications</h3>
        {meds ? (
          <>
            <p className="vd-hint">
              {meds.rxNo ?? "Last prescription"}
              {meds.issuedAt ? ` · ${formatDisplayDate(meds.issuedAt.slice(0, 10))}` : ""}
            </p>
            <ul className="vd-list">
              {meds.items.map((m, i) => (
                <li key={`${m.genericName}-${i}`}>
                  {m.brand || m.genericName} {m.strength}
                  <span className="vd-hint">
                    {" "}
                    · {m.frequency} · {m.days}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="vd-hint">No earlier prescription.</p>
        )}
      </section>

      <section className="vd-block">
        <h3>Last visits</h3>
        {page.lastVisits.length === 0 ? (
          <p className="vd-hint">This is the first visit.</p>
        ) : (
          <ul className="vd-list">
            {page.lastVisits.map((v) => (
              <li key={v.id}>
                <strong>{formatDisplayDate(v.visitDateLocal)}</strong>
                {v.chiefComplaint ? ` · ${v.chiefComplaint}` : ""}
                {v.examNote && <span className="vd-hint"> · {v.examNote}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="vd-block">
        <h3>Files</h3>
        {page.files.length === 0 ? (
          <p className="vd-hint">No files.</p>
        ) : (
          <ul className="vd-list">
            {page.files.map((f) => (
              <li key={f.id}>
                {f.originalFilename || f.kind}
                {f.toothFdi ? ` · ${f.toothFdi}` : ""}
              </li>
            ))}
          </ul>
        )}
        <Link to={`/app/patients/${patientId}?tab=files`} className="vd-link">
          Open all files
        </Link>
      </section>
    </>
  );
}
