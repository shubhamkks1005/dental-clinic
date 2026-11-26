import { previewHeight, rangeLabel } from "./cal-geometry";

/** What the popover is about to book, drawn in the clicked day column (P5.4.4). */
export type PreviewDraft = {
  dateLocal: string;
  startMin: number;
  minutes: number;
  patientName: string | null;
  visitLabel: string | null;
};

// Live preview block (HTML 102-113, 1145-1168; its markup is missing in the HTML, L2). The height
// follows the length (M5: 220 ms) and the border glows while the popover is open (M6: 2 s loop).
export function SlotPreview({ draft, top }: { draft: PreviewDraft; top: number }) {
  return (
    <div
      className="cal-preview"
      style={{ top, height: previewHeight(draft.minutes) }}
      data-testid="slot-preview"
      aria-hidden="true"
    >
      <span className="cal-preview-top">
        <span className="cal-preview-name">{draft.patientName ?? "New booking"}</span>
        <span className="cal-preview-dur">{draft.minutes}m</span>
      </span>
      {draft.visitLabel ? <span className="cal-preview-visit">{draft.visitLabel}</span> : null}
      <span className="cal-preview-range">{rangeLabel(draft.startMin, draft.minutes, "-")}</span>
    </div>
  );
}
