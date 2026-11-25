import { FDI_PERMANENT, FDI_PRIMARY, type AnnotationItem } from "@clinic/shared";
import { useState } from "react";
import { NativeInput, Textarea } from "../../ui/form";
import { toggleTooth, type Adjust, type Tool } from "./xray-model";

type Props = {
  adjust: Adjust;
  onAdjust: (a: Adjust) => void;
  tool: Tool;
  onTool: (t: Tool) => void;
  text: string;
  onText: (t: string) => void;
  width: number;
  onWidth: (w: number) => void;
  teeth: number[];
  onTeeth: (t: number[]) => void;
  note: string;
  onNote: (n: string) => void;
  canEdit: boolean;
  calibrated: boolean;
  lastMeasure: Extract<AnnotationItem, { type: "measure" }> | null;
  onCalibrate: (knownMm: number) => string | null;
};

const TOOLS: [Tool, string][] = [
  ["pan", "Pan"],
  ["pen", "Pen"],
  ["circle", "Circle"],
  ["arrow", "Arrow"],
  ["text", "Text"],
  ["measure", "Measure (mm)"],
];

const HINT: Record<Tool, string> = {
  pan: "Drag image to pan, scroll to zoom X-ray, or pick Pen / Circle / Arrow / Text / Measure.",
  pen: "Drag on the picture to draw freehand. Double-click a mark to remove it.",
  circle: "Drag from the centre outwards to draw a circle.",
  arrow: "Drag from the tail to the point.",
  text: "Click where the label goes.",
  measure: "Drag a line to measure it. Set the scale first to read it in mm.",
};

/** Side panel of the viewer: adjustments, tools, teeth tags, one note per picture, calibration. */
export function XraySidePanel(p: Props) {
  const [primary, setPrimary] = useState(false);
  const [known, setKnown] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const set = <K extends keyof Adjust>(k: K, v: Adjust[K]) => p.onAdjust({ ...p.adjust, [k]: v });
  const teethList = primary ? FDI_PRIMARY : FDI_PERMANENT;

  return (
    <aside className="vd-xv-side">
      <div className="vd-xv-group">
        <span className="vd-tc-label">Image Adjustment</span>
        <label>
          <span>Brightness {p.adjust.brightness}%</span>
          <NativeInput
            type="range"
            min={50}
            max={200}
            value={p.adjust.brightness}
            onChange={(e) => set("brightness", Number(e.target.value))}
          />
        </label>
        <label>
          <span>Contrast {p.adjust.contrast}%</span>
          <NativeInput
            type="range"
            min={50}
            max={200}
            value={p.adjust.contrast}
            onChange={(e) => set("contrast", Number(e.target.value))}
          />
        </label>
        <div className="vd-xv-row">
          {(["gray", "invert", "enhance"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={`vd-small-btn${p.adjust[k] ? " is-on" : ""}`}
              aria-pressed={p.adjust[k]}
              onClick={() => set(k, !p.adjust[k])}
            >
              {k === "gray" ? "Grayscale" : k === "invert" ? "Invert" : "Enhance"}
            </button>
          ))}
        </div>
      </div>

      <div className="vd-xv-group">
        <span className="vd-tc-label">Dental Annotation Tools</span>
        <div className="vd-xv-row">
          {TOOLS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`vd-small-btn${p.tool === id ? " is-on" : ""}`}
              aria-pressed={p.tool === id}
              disabled={!p.canEdit && id !== "pan"}
              onClick={() => p.onTool(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {p.tool === "text" && (
          <NativeInput
            className="vd-note"
            type="text"
            maxLength={200}
            placeholder="Label text..."
            aria-label="Label text"
            value={p.text}
            onChange={(e) => p.onText(e.target.value)}
          />
        )}
        <label>
          <span>Line Thickness {p.width}px</span>
          <NativeInput
            type="range"
            min={1}
            max={8}
            step={0.5}
            value={p.width}
            onChange={(e) => p.onWidth(Number(e.target.value))}
          />
        </label>
        <p className="vd-hint">{HINT[p.tool]}</p>
        {p.tool === "measure" && p.canEdit && (
          <div className="vd-xv-calib">
            <span className="vd-hint">
              {p.calibrated
                ? "Scale is set. Measures show mm."
                : "No scale yet: measures show px. Draw a line of known length, then type it here."}
            </span>
            <div className="vd-xv-row">
              <NativeInput
                className="vd-fee-input"
                type="text"
                inputMode="decimal"
                placeholder="Known mm"
                aria-label="Known length in mm"
                value={known}
                onChange={(e) => setKnown(e.target.value)}
              />
              <button
                type="button"
                className="vd-primary-btn"
                disabled={!p.lastMeasure}
                onClick={() => {
                  const mm = Number(known);
                  setProblem(p.onCalibrate(mm));
                }}
              >
                Set scale from last line
              </button>
            </div>
            {problem && (
              <span role="alert" className="vd-hint">
                {problem}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="vd-xv-group">
        <span className="vd-tc-label">FDI Tooth Selection (Multi)</span>
        <div className="vd-xv-row">
          <button
            type="button"
            className={`vd-small-btn${!primary ? " is-on" : ""}`}
            onClick={() => setPrimary(false)}
          >
            Permanent
          </button>
          <button
            type="button"
            className={`vd-small-btn${primary ? " is-on" : ""}`}
            onClick={() => setPrimary(true)}
          >
            Primary
          </button>
        </div>
        <div className="vd-xv-teeth" role="group" aria-label="Teeth on this picture">
          {teethList.map((t) => (
            <button
              key={t}
              type="button"
              className="vd-surface"
              aria-pressed={p.teeth.includes(t)}
              disabled={!p.canEdit}
              onClick={() => p.onTeeth(toggleTooth(p.teeth, t))}
            >
              {t}
            </button>
          ))}
        </div>
        <label>
          <span>Tooth-wise annotation note</span>
          <Textarea
            className="vd-note-area"
            rows={2}
            maxLength={500}
            placeholder="e.g. 36: Apical radiolucency, working length 20.5 mm"
            value={p.note}
            disabled={!p.canEdit}
            onChange={(e) => p.onNote(e.target.value)}
          />
        </label>
      </div>
    </aside>
  );
}
