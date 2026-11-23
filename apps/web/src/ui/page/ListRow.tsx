import type { ReactNode } from "react";
import { Link } from "react-router";

type Props = {
  /** When set, the WHOLE row is the link (44 px or taller). */
  to?: string;
  title: ReactNode;
  /** Second line: visit type, date, number. Separate values with a middle dot yourself. */
  meta?: ReactNode;
  /** Right side: a status label, an amount or a button. */
  trailing?: ReactNode;
  /** Line under the name on a phone: the row's action (Take payment, Send in). */
  below?: ReactNode;
};

// One list row everywhere. The action sits under the name on a phone, at the right on a laptop.
export function ListRow({ to, title, meta, trailing, below }: Props) {
  const body = (
    <>
      <span className="list-row-main">
        <span className="list-row-title">{title}</span>
        {meta ? <span className="list-row-meta muted">{meta}</span> : null}
      </span>
      {trailing ? <span className="list-row-trailing">{trailing}</span> : null}
    </>
  );
  return (
    <li className="list-row">
      {to ? (
        <Link to={to} className="list-row-line">
          {body}
        </Link>
      ) : (
        <div className="list-row-line">{body}</div>
      )}
      {below ? <div className="list-row-below">{below}</div> : null}
    </li>
  );
}

export function ListRows({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul className="list-rows" aria-label={label}>
      {children}
    </ul>
  );
}
