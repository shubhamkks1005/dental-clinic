import type { ReactNode } from "react";

type Props = {
  title?: ReactNode;
  /** Link or small button at the right of the title. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Name for screen readers when there is no visible title. */
  label?: string;
};

// White card, 16 px radius, 16 px padding. Title is an h2.
export function Card({ title, action, children, className = "", label }: Props) {
  return (
    <section className={`card ui-card ${className}`.trim()} aria-label={title ? undefined : label}>
      {title || action ? (
        <div className="ui-card-head">
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
