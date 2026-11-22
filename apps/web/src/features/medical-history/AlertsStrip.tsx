import type { AlertRow } from "./api";
import "./medical-history.css";

export type AlertFlags = { hasAlert: boolean; hasRestricted: boolean };

type FullProps = {
  mode: "full";
  alerts: AlertRow[];
};

type IconProps = {
  mode: "icon";
  flags: AlertFlags;
};

type Props = FullProps | IconProps;

/** 3.3.2: doctor profile shows labels; appointment cards show a small icon only. Never print/SMS. */
export function AlertsStrip(props: Props) {
  if (props.mode === "icon") {
    if (!props.flags.hasAlert) return null;
    const title = props.flags.hasRestricted
      ? "Doctor to check"
      : "Medical alert — open the patient profile";
    return (
      <span className="mh-alert-icon" title={title} aria-label={title}>
        !
      </span>
    );
  }

  if (props.alerts.length === 0) return null;
  return (
    <ul className="mh-alert-list" aria-label="Medical alerts">
      {props.alerts.map((a) => (
        <li key={a.id} className={a.restricted ? "mh-alert-restricted" : "mh-alert"}>
          {a.label}
        </li>
      ))}
    </ul>
  );
}
