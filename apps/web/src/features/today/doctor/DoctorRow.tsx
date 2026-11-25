import { icons } from "../../../ui/icons";
import { PatientNoChip } from "../../../ui/PatientNoChip";
import type { DoctorRow as Row } from "./doctor-model";
import { pillHasDot, PILL_CLASS, rowAction, rowLabel } from "./row-status";

type Props = {
  row: Row;
  lifted: boolean;
  removing: boolean;
  cancelled: boolean;
  hidden: boolean;
  spotlight: boolean;
  startBlocked: string | null;
  onOpen: (row: Row) => void;
  onStart: (row: Row) => void;
  onBack: (row: Row) => void;
  onMenu: (row: Row, button: HTMLButtonElement) => void;
};

/** One patient in Today's list (docs/design/final/doctor_today.html "list-row"). */
export function DoctorRow({
  row,
  lifted,
  removing,
  cancelled,
  hidden,
  spotlight,
  startBlocked,
  onOpen,
  onStart,
  onBack,
  onMenu,
}: Props) {
  const action = rowAction(row);
  const cls = [
    "td-row",
    `td-row-${row.kind}`,
    row.isNext ? "is-next" : "",
    lifted ? "is-lifted" : "",
    removing ? "is-removing" : "",
    cancelled ? "is-cancelled" : "",
    hidden ? "is-search-hidden" : "",
    spotlight ? "is-spotlight" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <li className={cls} data-row-id={row.id} data-kind={row.kind} aria-hidden={hidden || undefined}>
      <button
        type="button"
        className="td-row-main"
        aria-label={rowLabel(row)}
        onClick={() => onOpen(row)}
      >
        <span className="td-time">
          <span className="td-time-main">{row.timeLabel}</span>
          {row.exp ? <span className="td-exp">{row.exp}</span> : null}
        </span>
        <span className="td-who">
          <span className="td-name-line">
            <span className="td-name">{row.name}</span>
            {row.isNext ? <span className="td-pill td-pill-primary td-tag">Next</span> : null}
            {row.alert ? <span className="td-pill td-pill-error td-tag">{row.alert}</span> : null}
          </span>
          <span className="td-sub">
            <PatientNoChip patientNo={row.patientCode} />
            <span aria-hidden="true">·</span>
            <span className="td-visit">{row.visit}</span>
          </span>
        </span>
      </button>
      <div className="td-row-side">
        <span
          className={`td-pill td-status ${cancelled ? "td-pill-cancelled" : PILL_CLASS[row.kind]}`}
        >
          {pillHasDot(row.kind) && !cancelled ? (
            <span className="td-dot" aria-hidden="true" />
          ) : null}
          {cancelled ? "Cancelled" : row.pill}
        </span>
        {action && !cancelled ? (
          <button
            type="button"
            className={`td-btn td-action${action.primary ? " is-primary" : ""}`}
            disabled={action.label === "Start" && startBlocked !== null}
            title={action.label === "Start" ? (startBlocked ?? undefined) : undefined}
            onClick={() => (action.label === "Back" ? onBack(row) : onStart(row))}
          >
            {action.label}
          </button>
        ) : (
          <span className="td-action-gap" aria-hidden="true" />
        )}
        {row.kind !== "done" ? (
          <button
            type="button"
            className="td-btn td-more"
            aria-haspopup="menu"
            aria-label={`More actions for ${row.name}`}
            onClick={(e) => onMenu(row, e.currentTarget)}
          >
            {icons.more}
          </button>
        ) : (
          <span className="td-more-gap" aria-hidden="true" />
        )}
      </div>
    </li>
  );
}
