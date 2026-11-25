import { useEffect, useRef, useState } from "react";
import { fileContentUrl } from "../files/api";
import {
  makeScale,
  FRESH_ADJUST,
  FRESH_VIEW,
  clampZoom,
  rotateBy,
  zoomPercent,
  type Adjust,
  type Tool,
  type View,
} from "./xray-model";
import { historyDate } from "./tooth-model";
import type { VisitPageData } from "./page-api";
import { useXrayAnnotations } from "./useXrayAnnotations";
import { XrayCanvas } from "./XrayCanvas";
import { XraySidePanel } from "./XraySidePanel";

export type XrayFile = VisitPageData["files"][number];

type Props = {
  files: XrayFile[];
  startId: string;
  patient: { fullName: string; code: string };
  canEdit: boolean;
  onClose: () => void;
};

/** Full-screen picture viewer (design: xray-viewer-modal): look, compare, mark, save. */
export function XrayViewer({ files, startId, patient, canEdit, onClose }: Props) {
  const [index, setIndex] = useState(
    Math.max(
      0,
      files.findIndex((f) => f.id === startId),
    ),
  );
  const file = files[index];
  const prev = files[index + 1] ?? null; // newest first: the next one is the earlier picture
  const [view, setView] = useState<View>(FRESH_VIEW);
  const [adjust, setAdjust] = useState<Adjust>(FRESH_ADJUST);
  const [tool, setTool] = useState<Tool>("pan");
  const [width, setWidth] = useState(2.5);
  const [text, setText] = useState("");
  const [compare, setCompare] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const ann = useXrayAnnotations(
    file?.id ?? null,
    canEdit && file?.mime.startsWith("image/") === true,
  );

  useEffect(() => {
    root.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);
  useEffect(() => {
    setView(FRESH_VIEW);
    setCompare(false);
  }, [index]);

  if (!file) return null;
  const isImage = file.mime.startsWith("image/");
  const lastMeasure = [...ann.items].reverse().find((i) => i.type === "measure") ?? null;
  const zoom = (d: number) => setView((v) => ({ ...v, zoom: clampZoom(v.zoom + d) }));

  return (
    <div
      className="vd-xv"
      role="dialog"
      aria-modal="true"
      aria-label="X-ray viewer"
      ref={root}
      tabIndex={-1}
    >
      <header className="vd-xv-head">
        <div className="vd-xv-who">
          <span className="vd-pill vd-pill-primary">X-RAY VIEWER</span>
          <strong>{patient.fullName}</strong>
          <span className="vd-code">{patient.code}</span>
          <span>
            {file.originalFilename || file.kind} · {file.takenOn ?? historyDate(file.createdAt)}
          </span>
        </div>
        <div className="vd-xv-nav">
          <button
            type="button"
            className="vd-small-btn"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            ‹ Prev
          </button>
          <span>
            {index + 1} / {files.length}
          </span>
          <button
            type="button"
            className="vd-small-btn"
            disabled={index >= files.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            Next ›
          </button>
          <button type="button" className="vd-small-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </header>

      <div className="vd-xv-bars">
        <div className="vd-xv-row">
          <button type="button" className="vd-small-btn" title="Zoom In" onClick={() => zoom(0.2)}>
            +
          </button>
          <span className="vd-xv-pct">{zoomPercent(view.zoom)}</span>
          <button
            type="button"
            className="vd-small-btn"
            title="Zoom Out"
            onClick={() => zoom(-0.2)}
          >
            -
          </button>
          <button type="button" className="vd-small-btn" onClick={() => setView(FRESH_VIEW)}>
            Fit
          </button>
          <button
            type="button"
            className="vd-small-btn"
            onClick={() => void root.current?.requestFullscreen?.()}
          >
            Full
          </button>
          <button
            type="button"
            className="vd-small-btn"
            title="Rotate Left"
            onClick={() => setView(rotateBy(view, -90))}
          >
            ↺ 90°
          </button>
          <button
            type="button"
            className="vd-small-btn"
            title="Rotate Right"
            onClick={() => setView(rotateBy(view, 90))}
          >
            ↻ 90°
          </button>
          <button
            type="button"
            className="vd-small-btn"
            onClick={() => setView({ ...view, flipH: !view.flipH })}
          >
            Flip H
          </button>
          <button
            type="button"
            className="vd-small-btn"
            onClick={() => setView({ ...view, flipV: !view.flipV })}
          >
            Flip V
          </button>
          <button
            type="button"
            className={`vd-small-btn${compare ? " is-on" : ""}`}
            aria-pressed={compare}
            onClick={() => setCompare(!compare)}
          >
            Compare (Prev vs Current)
          </button>
        </div>
        <div className="vd-xv-row">
          <button type="button" className="vd-small-btn" disabled={!ann.canUndo} onClick={ann.undo}>
            Undo
          </button>
          <button type="button" className="vd-small-btn" disabled={!ann.canRedo} onClick={ann.redo}>
            Redo
          </button>
          <button type="button" className="vd-small-btn" disabled={!canEdit} onClick={ann.reset}>
            Reset All
          </button>
          <a
            className="vd-small-btn"
            href={fileContentUrl(file.id)}
            download={file.originalFilename || "picture"}
          >
            Download
          </a>
          <button type="button" className="vd-small-btn" onClick={() => window.print()}>
            Print
          </button>
          <button
            type="button"
            className="vd-primary-btn"
            disabled={!canEdit || !ann.dirty || ann.saving}
            onClick={() => void ann.save()}
          >
            {ann.saving ? "Saving…" : "Save Annotations"}
          </button>
          {ann.saved && (
            <span className="vd-pill vd-pill-success" role="status">
              Annotations saved to visit!
            </span>
          )}
        </div>
        {ann.error && (
          <p className="vd-error" role="alert">
            {ann.error}
          </p>
        )}
      </div>

      <div className="vd-xv-body">
        <div className="vd-xv-view">
          {isImage ? (
            <XrayCanvas
              fileId={file.id}
              prevFileId={prev?.mime.startsWith("image/") ? prev.id : null}
              compare={compare}
              view={view}
              adjust={adjust}
              tool={tool}
              width={width}
              text={text}
              scale={ann.annotations.scale}
              items={ann.items}
              canEdit={canEdit}
              onView={setView}
              onAdd={ann.addItem}
              onRemove={ann.removeItem}
            />
          ) : (
            <div className="vd-xv-pdf">
              <strong>{file.originalFilename || "Document"}</strong>
              <a href={fileContentUrl(file.id)} target="_blank" rel="noreferrer">
                Open the document
              </a>
            </div>
          )}
        </div>
        <XraySidePanel
          adjust={adjust}
          onAdjust={setAdjust}
          tool={tool}
          onTool={setTool}
          text={text}
          onText={setText}
          width={width}
          onWidth={setWidth}
          teeth={ann.annotations.teeth ?? []}
          onTeeth={ann.setTeeth}
          note={ann.annotations.note ?? ""}
          onNote={ann.setNote}
          canEdit={canEdit && isImage}
          calibrated={ann.annotations.scale !== null}
          lastMeasure={lastMeasure}
          onCalibrate={(mm) => {
            if (!lastMeasure) return "Draw a line first.";
            const scale = makeScale(lastMeasure, mm);
            if (!scale) return "Enter the real length of that line in mm (up to 500).";
            ann.setScale(scale);
            return null;
          }}
        />
      </div>
    </div>
  );
}
