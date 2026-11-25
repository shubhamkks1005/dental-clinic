import { formatClockTime, istMinutes } from "@clinic/shared";
import { useRef, type ReactNode } from "react";
import { icons } from "../../../ui/icons";
import type { DoctorModel, DoctorRow as Row } from "./doctor-model";
import { DoctorRow } from "./DoctorRow";
import { useFlip } from "./useFlip";

type Props = {
  model: DoctorModel;
  /** Ids the search box hides; `spotlightId` is the row the search jumped to. */
  hiddenIds: ReadonlySet<string>;
  spotlightId: string | null;
  liftedId: string | null;
  removingIds: ReadonlySet<string>;
  cancelledIds: ReadonlySet<string>;
  startBlocked: string | null;
  restore: ReactNode;
  onOpen: (row: Row) => void;
  onStart: (row: Row) => void;
  onBack: (row: Row) => void;
  onMenu: (row: Row, button: HTMLButtonElement) => void;
};

function LunchDivider({ model }: { model: DoctorModel }) {
  const lunch = model.lunch;
  if (!lunch || model.lunchAt === null) return null;
  const range = `${formatClockTime(lunch.startMin)}–${formatClockTime(lunch.endMin)}`;
  return (
    <li className="td-lunch" aria-label={`Lunch break ${range}`}>
      <span className="td-time">
        <span className="td-time-main">{formatClockTime(lunch.startMin)}</span>
        <span className="td-exp">Midday</span>
      </span>
      <span className="td-lunch-chip">
        <span className="td-lunch-icon" aria-hidden="true">
          {icons.restaurant}
        </span>
        <strong>Lunch break</strong>
        <span aria-hidden="true">·</span>
        <span>{range}</span>
      </span>
      <span className="td-lunch-counts">
        <span className="td-lunch-count">
          {icons.sun}
          {model.lunchAt} before lunch
        </span>
        <span className="td-lunch-count is-after">
          {icons.sunset}
          {model.rows.length - model.lunchAt} after lunch
        </span>
      </span>
    </li>
  );
}

/** Today's list: one scrollable list, every patient once, in the doctor's saved order. */
export function DoctorList({
  model,
  hiddenIds,
  spotlightId,
  liftedId,
  removingIds,
  cancelledIds,
  startBlocked,
  restore,
  onOpen,
  onStart,
  onBack,
  onMenu,
}: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  useFlip(listRef, model.rows.map((r) => `${r.id}:${r.kind}`).join("|"));
  const searching = hiddenIds.size > 0;
  const total = model.rows.length + (model.chair ? 1 : 0);
  const note = model.lastOrderChange
    ? `Order updated${model.lastOrderChange.byName ? ` by ${model.lastOrderChange.byName}` : ""} at ${formatClockTime(istMinutes(new Date(model.lastOrderChange.at)))}`
    : null;

  return (
    <section className="td-card td-list-card" aria-label="Today's list">
      <header className="td-card-head">
        <div className="td-head-left">
          <h2>Today's list</h2>
          <span className="td-count">
            {total} {total === 1 ? "patient" : "patients"}
          </span>
        </div>
        <div className="td-head-right">
          <span className="td-note" aria-live="polite">
            {note}
          </span>
          {restore}
        </div>
      </header>
      <div className="td-cols" aria-hidden="true">
        <span className="td-col-main">
          <span className="td-col-time">Time</span>
          <span>Patient &amp; Visit</span>
        </span>
        <span className="td-col-side">
          <span className="td-col-status">Status</span>
          <span className="td-col-action">Action</span>
        </span>
      </div>
      {model.rows.length === 0 ? (
        <div className="td-empty-list">
          {model.chair
            ? "No one waiting. Current patient is in the chair above."
            : "No one waiting right now."}
        </div>
      ) : (
        <ul className="td-rows" ref={listRef}>
          {model.rows.map((row, i) => (
            <RowWithDivider key={row.id} divider={!searching && i === model.lunchAt} model={model}>
              <DoctorRow
                row={row}
                lifted={liftedId === row.id}
                removing={removingIds.has(row.id)}
                cancelled={cancelledIds.has(row.id)}
                hidden={hiddenIds.has(row.id)}
                spotlight={spotlightId === row.id}
                startBlocked={startBlocked}
                onOpen={onOpen}
                onStart={onStart}
                onBack={onBack}
                onMenu={onMenu}
              />
            </RowWithDivider>
          ))}
          {!searching && model.lunchAt === model.rows.length ? (
            <LunchDivider model={model} />
          ) : null}
        </ul>
      )}
    </section>
  );
}

function RowWithDivider({
  divider,
  model,
  children,
}: {
  divider: boolean;
  model: DoctorModel;
  children: ReactNode;
}) {
  return (
    <>
      {divider ? <LunchDivider model={model} /> : null}
      {children}
    </>
  );
}
