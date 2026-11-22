import { useState } from "react";
import { fileContentUrl } from "./api";
import {
  DEFAULT_VIEWER,
  viewerFilterCss,
  viewerTransformCss,
  type ViewerFilters,
} from "./file-viewer-state";
import { FileViewerControls } from "./FileViewerControls";

type Props = {
  primaryId: string;
  compareId: string | null;
  onClose: () => void;
};

export function FileViewer({ primaryId, compareId, onClose }: Props) {
  const [left, setLeft] = useState<ViewerFilters>(DEFAULT_VIEWER);
  const [right, setRight] = useState<ViewerFilters>(DEFAULT_VIEWER);

  return (
    <div className="file-viewer" role="dialog" aria-label="File viewer">
      <div className="file-viewer-toolbar">
        <button type="button" onClick={onClose}>
          Close
        </button>
        <span className="muted small">Drag image to pan · sliders for brightness/contrast</span>
      </div>
      <div className={`file-viewer-stage${compareId ? " is-compare" : ""}`}>
        <ViewerPane
          id={primaryId}
          filters={left}
          onChange={setLeft}
          label={compareId ? "Before / A" : "Image"}
        />
        {compareId ? (
          <ViewerPane id={compareId} filters={right} onChange={setRight} label="After / B" />
        ) : null}
      </div>
    </div>
  );
}

function ViewerPane({
  id,
  filters,
  onChange,
  label,
}: {
  id: string;
  filters: ViewerFilters;
  onChange: (f: ViewerFilters) => void;
  label: string;
}) {
  return (
    <div className="file-viewer-pane">
      <p className="small">{label}</p>
      <FileViewerControls value={filters} onChange={onChange} />
      <div
        className="file-viewer-canvas"
        onPointerDown={(e) => {
          const startX = e.clientX;
          const startY = e.clientY;
          const origin = { x: filters.panX, y: filters.panY };
          const move = (ev: PointerEvent) => {
            onChange({
              ...filters,
              panX: origin.x + (ev.clientX - startX),
              panY: origin.y + (ev.clientY - startY),
            });
          };
          const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        }}
      >
        <img
          src={fileContentUrl(id)}
          alt=""
          draggable={false}
          style={{
            filter: viewerFilterCss(filters),
            transform: viewerTransformCss(filters),
          }}
        />
      </div>
    </div>
  );
}
