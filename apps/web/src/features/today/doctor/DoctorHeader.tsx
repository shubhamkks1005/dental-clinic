import { BREAK_PRESETS, istLongDate, type CurrentBreak } from "@clinic/shared";
import { useRef, useState } from "react";
import { icons } from "../../../ui/icons";
import type { DoctorModel } from "./doctor-model";
import { DoctorSearch } from "./DoctorSearch";
import { PopMenu, type PopItem } from "./PopMenu";

type Props = {
  model: DoctorModel;
  now: Date;
  updatedAt: Date | null;
  refreshFailed: boolean;
  breakNow: CurrentBreak | null;
  /** Set when a break cannot start: someone is in the chair. */
  breakBlocked: string | null;
  onStartBreak: (minutes: number, label: string) => void;
  onHide: (ids: Set<string>) => void;
  onJump: (id: string) => void;
};

const BREAK_ICON = {
  5: icons.stretch,
  10: icons.leaf,
  15: icons.coffee,
  45: icons.restaurant,
} as const;
const BREAK_TAG = { 5: "Stretch", 10: "Rest", 15: "Coffee", 45: "Lunch" } as const;

function ago(from: Date | null, now: Date): string {
  if (!from) return "Updating…";
  const mins = Math.floor((now.getTime() - from.getTime()) / 60_000);
  return mins < 1 ? "Updated just now" : `Updated ${mins} min ago`;
}

/** The summary strip of the doctor's Today (design 6.1): date, state, counts, search, break. */
export function DoctorHeader({
  model,
  now,
  updatedAt,
  refreshFailed,
  breakNow,
  breakBlocked,
  onStartBreak,
  onHide,
  onJump,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const state = breakNow
    ? { text: "On break", cls: "td-pill-warning" }
    : model.chair
      ? { text: "Visit in progress", cls: "td-pill-info" }
      : { text: "Free", cls: "td-pill-success" };
  const items: PopItem[] = BREAK_PRESETS.map((p) => ({
    key: String(p.minutes),
    label: `${p.minutes} min`,
    icon: BREAK_ICON[p.minutes],
    right: BREAK_TAG[p.minutes],
    onSelect: () => onStartBreak(p.minutes, p.label),
  }));

  return (
    <section className="td-header" aria-label="Doctor status summary">
      <div className="td-header-main">
        <div className="td-title-line">
          <h1>{istLongDate(now)}</h1>
          <span className={`td-pill ${state.cls}`} aria-live="polite">
            <span className="td-dot" aria-hidden="true" />
            {state.text}
          </span>
          {model.lateMinutes > 0 ? (
            <span className="td-pill td-pill-warning">
              <span className="td-ic" aria-hidden="true">
                {icons.clock}
              </span>
              {model.lateMinutes} min late
            </span>
          ) : null}
        </div>
        <p className="td-counts">
          <span>
            <strong>{model.waiting}</strong> waiting
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong>{model.notArrived}</strong> not yet arrived
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong>{model.done}</strong> done
          </span>
          <span aria-hidden="true">·</span>
          <span className={`td-updated${refreshFailed ? " is-failed" : ""}`} role="status">
            <span className="td-ic" aria-hidden="true">
              {icons.sync}
            </span>
            {refreshFailed ? "Couldn't refresh. Showing the last list." : ago(updatedAt, now)}
          </span>
        </p>
      </div>
      <div className="td-header-tools">
        <DoctorSearch model={model} onHide={onHide} onJump={onJump} />
        <div className="td-break-wrap">
          <button
            ref={button}
            type="button"
            className="td-btn td-break-btn"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            disabled={breakBlocked !== null || breakNow !== null}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="td-ic" aria-hidden="true">
              {icons.coffee}
            </span>
            Take a break
            <span className="td-ic" aria-hidden="true">
              {icons.chevronDown}
            </span>
          </button>
          {breakBlocked ? <p className="td-hint">{breakBlocked}</p> : null}
          <PopMenu
            label="Take a break"
            open={menuOpen}
            anchor={button.current}
            items={items}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      </div>
    </section>
  );
}
