import type { ReactNode } from "react";
import "./page.css";

// The one page frame (PA-D01): max width 1200, 16 px gutters on a phone, 24 px from tablet up.
// The staff shell wraps every screen in it, so a screen never sets its own outer margin.
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="page">{children}</div>;
}

type HeaderProps = {
  title: ReactNode;
  /** One line, only when it helps. */
  subtitle?: ReactNode;
  /** One primary button (and at most one quiet one) at the right; wraps under the title on a phone. */
  actions?: ReactNode;
  /** Phone only: a "‹ More" style link above the title. */
  back?: ReactNode;
};

export function PageHeader({ title, subtitle, actions, back }: HeaderProps) {
  return (
    <header className="page-header">
      {back ? <div className="page-back">{back}</div> : null}
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
