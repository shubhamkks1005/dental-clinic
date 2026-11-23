import type { ReactNode } from "react";

// One sentence and (at most) one action. Never a blank area.
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <p className="muted">{children}</p>
      {action}
    </div>
  );
}
