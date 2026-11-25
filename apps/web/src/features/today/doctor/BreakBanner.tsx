import {
  BREAK_MIN_MINUTES,
  BREAK_STEP_MINUTES,
  formatClockTime,
  istMinutes,
  type CurrentBreak,
} from "@clinic/shared";
import { useEffect, useRef, useState } from "react";
import { icons } from "../../../ui/icons";
import { useVisibleInterval } from "../../../ui/useVisibleInterval";

const mmss = (secs: number) =>
  `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

type Props = {
  current: CurrentBreak | null;
  doctorName: string;
  busy: boolean;
  onAdjust: (delta: number) => void;
  onBack: () => void;
};

/** When the break is over (the banner stays until the doctor says "I'm back"). */
export function breakEndsAtMs(b: Pick<CurrentBreak, "startedAt" | "minutes">): number {
  return new Date(b.startedAt).getTime() + b.minutes * 60_000;
}

/**
 * The break banner (design: #break-banner). The countdown comes from the server's start time and
 * length, so a reload or a second tab shows the same time. It ticks once a second only while the
 * tab is visible, and stops at 00:00 with "Break is over".
 */
export function BreakBanner({ current, doctorName, busy, onAdjust, onBack }: Props) {
  const [, setTick] = useState(0);
  // The bar must not animate from empty on the first paint: it only animates once it is on screen.
  const [barReady, setBarReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setBarReady(true), 80);
    return () => window.clearTimeout(t);
  }, []);
  useVisibleInterval(() => setTick((t) => t + 1), 1000);
  // Keep the last break while the banner folds away, so the text does not jump.
  const shown = useRef<CurrentBreak | null>(null);
  if (current) shown.current = current;
  const b = current ?? shown.current;
  const total = b ? b.minutes * 60 : 0;
  const left = b ? Math.max(0, Math.ceil((breakEndsAtMs(b) - Date.now()) / 1000)) : 0;
  const over = b !== null && left === 0;
  const pct = current && total > 0 ? Math.min(100, (left / total) * 100) : 100;
  const canShorten =
    b !== null &&
    b.minutes - BREAK_STEP_MINUTES >= BREAK_MIN_MINUTES &&
    left > BREAK_STEP_MINUTES * 60;
  const back = b ? formatClockTime(istMinutes(new Date(breakEndsAtMs(b)))) : "";

  return (
    <section
      className={`td-break${current ? " is-active" : ""}`}
      aria-label="Break"
      aria-hidden={!current}
    >
      <span className="td-orb td-orb-1" aria-hidden="true" />
      <span className="td-orb td-orb-2" aria-hidden="true" style={{ animationDelay: "1.8s" }} />
      <div className="td-break-left">
        <span className="td-break-cup">
          <span className="td-steam-1" aria-hidden="true" />
          <span className="td-steam-2" aria-hidden="true" />
          <span className="td-cup" aria-hidden="true">
            {icons.coffee}
          </span>
        </span>
        <div>
          <p className="td-break-title">
            <strong>{over ? "Break is over" : "Break mode · Relax & recharge"}</strong>
            {b ? (
              <span className="td-pill td-break-pill td-pop" key={b.minutes}>
                {b.minutes} min · {b.label}
              </span>
            ) : null}
          </p>
          <p className="td-break-sub" aria-live="polite">
            {over
              ? `Back whenever you are ready, Dr. ${doctorName}.`
              : `Back about ${back} · Take a breather, Dr. ${doctorName}.`}
          </p>
        </div>
      </div>
      <div className="td-break-right">
        <div className="td-clock">
          <span>
            <small>Time left</small>
            <strong className="td-mono">{mmss(left)}</strong>
          </span>
          <span className="td-clock-split" aria-hidden="true" />
          <span>
            <small>Total</small>
            <span className="td-mono td-pop" key={total}>
              {mmss(total)}
            </span>
          </span>
        </div>
        <button
          type="button"
          className="td-btn"
          disabled={busy || !canShorten}
          onClick={() => onAdjust(-BREAK_STEP_MINUTES)}
        >
          -5 min
        </button>
        <button
          type="button"
          className="td-btn"
          disabled={busy}
          onClick={() => onAdjust(BREAK_STEP_MINUTES)}
        >
          +5 min
        </button>
        <button type="button" className="td-btn is-primary" disabled={busy} onClick={onBack}>
          I'm back
        </button>
      </div>
      <span className="td-break-track" aria-hidden="true">
        <span
          className="td-break-bar"
          style={{ width: `${pct}%`, transition: barReady && current ? undefined : "none" }}
        />
      </span>
    </section>
  );
}
