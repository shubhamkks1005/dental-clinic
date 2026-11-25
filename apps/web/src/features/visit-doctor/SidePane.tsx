import type { ReactNode } from "react";
import { HistoryCards } from "./HistoryCards";
import type { VisitPageData } from "./page-api";

export type SideTab = "rx" | "history";

type Props = {
  tab: SideTab;
  onTab: (tab: SideTab) => void;
  page: VisitPageData;
  onIssue: () => void;
  onFile: (id: string) => void;
  /** The live prescription sheet (tab 1). */
  rx: ReactNode;
  paneRef?: React.RefObject<HTMLElement | null>;
  handles?: {
    corner: React.HTMLAttributes<HTMLElement>;
    down: React.HTMLAttributes<HTMLElement>;
  };
};

/** Right pane: the live prescription (next step) and the patient's History from the one page read. */
export function SidePane({ tab, onTab, page, onIssue, onFile, rx, paneRef, handles }: Props) {
  return (
    <aside
      className="vd-side"
      aria-label="Prescription and history"
      ref={paneRef as React.RefObject<HTMLElement>}
    >
      <div className="vd-side-top">
        <div className="vd-tabs" role="tablist" aria-label="Side pane">
          {(
            [
              ["rx", "Live A4 Rx"],
              ["history", "History"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`vd-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`vd-panel-${id}`}
              className={`vd-tab${tab === id ? " is-on" : ""}`}
              onClick={() => onTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="vd-issue" onClick={onIssue}>
          Issue Rx
        </button>
      </div>

      {tab === "rx" ? (
        <div className="vd-panel" role="tabpanel" id="vd-panel-rx" aria-labelledby="vd-tab-rx">
          {rx}
        </div>
      ) : (
        <div
          className="vd-panel"
          role="tabpanel"
          id="vd-panel-history"
          aria-labelledby="vd-tab-history"
        >
          <HistoryCards page={page} onFile={onFile} />
        </div>
      )}
      {handles && (
        <>
          <div
            className="vd-resize-bottom"
            title="Drag vertically to resize height"
            {...handles.down}
          />
          <div
            className="vd-resize-corner"
            title="Drag diagonally to resize width and height (double-click to reset)"
            {...handles.corner}
          />
        </>
      )}
    </aside>
  );
}
