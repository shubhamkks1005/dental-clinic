import { useId, useState, type ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  table: ReactNode;
  /** Live region text for the focused point (keyboard / screen reader). */
  announce?: string;
};

/** Title + chart/table toggle so every chart is readable without a mouse (6.3.2). */
export function ChartFrame({ title, children, table, announce }: Props) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const tableId = useId();
  return (
    <section className="chart-frame card">
      <header className="chart-frame-head">
        <h2 className="chart-frame-title">{title}</h2>
        <button
          type="button"
          className="btn btn-secondary chart-frame-toggle"
          aria-pressed={mode === "table"}
          aria-controls={tableId}
          onClick={() => setMode((m) => (m === "chart" ? "table" : "chart"))}
        >
          {mode === "chart" ? "Show table" : "Show chart"}
        </button>
      </header>
      {mode === "chart" ? (
        <div className="chart-frame-body">{children}</div>
      ) : (
        <div id={tableId} className="chart-frame-table">
          {table}
        </div>
      )}
      <p className="chart-frame-live" aria-live="polite">
        {announce ?? ""}
      </p>
    </section>
  );
}
