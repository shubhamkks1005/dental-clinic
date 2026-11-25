import {
  ANNOTATION_H,
  ANNOTATION_W,
  measureLength,
  type AnnotationItem,
  type FileAnnotations,
} from "@clinic/shared";

// Rules of the X-ray viewer (design: xv* functions). Pure, so they are tested without a browser.

export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 6;

export const clampZoom = (z: number) =>
  Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)) * 100) / 100;
export const zoomPercent = (z: number) => `${Math.round(z * 100)}%`;

export type View = {
  zoom: number;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  x: number;
  y: number;
};
export const FRESH_VIEW: View = { zoom: 1, rotate: 0, flipH: false, flipV: false, x: 0, y: 0 };

export function viewTransform(v: View): string {
  return `translate(${v.x}px, ${v.y}px) rotate(${v.rotate}deg) scale(${v.flipH ? -v.zoom : v.zoom}, ${v.flipV ? -v.zoom : v.zoom})`;
}

export const rotateBy = (v: View, deg: number): View => ({
  ...v,
  rotate: (((v.rotate + deg) % 360) + 360) % 360,
});

export type Adjust = {
  brightness: number;
  contrast: number;
  gray: boolean;
  invert: boolean;
  enhance: boolean;
};
export const FRESH_ADJUST: Adjust = {
  brightness: 100,
  contrast: 100,
  gray: false,
  invert: false,
  enhance: false,
};

/** The CSS filter of the sliders and the three switches (Enhance adds a little contrast and sharpness). */
export function adjustFilter(a: Adjust): string {
  const parts = [`brightness(${a.brightness}%)`, `contrast(${a.contrast + (a.enhance ? 25 : 0)}%)`];
  if (a.gray) parts.push("grayscale(100%)");
  if (a.invert) parts.push("invert(100%)");
  if (a.enhance) parts.push("saturate(120%)");
  return parts.join(" ");
}

/** A pointer position to the viewer space (0 to 400 by 0 to 300), kept inside the image. */
export function toViewerPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): [number, number] {
  const px = ((clientX - rect.left) / rect.width) * ANNOTATION_W;
  const py = ((clientY - rect.top) / rect.height) * ANNOTATION_H;
  const r = (n: number) => Math.round(n * 10) / 10;
  return [r(Math.max(0, Math.min(ANNOTATION_W, px))), r(Math.max(0, Math.min(ANNOTATION_H, py)))];
}

export type Tool = "pan" | "pen" | "circle" | "arrow" | "text" | "measure";

/** One mark from a finished drag. Returns null for a tap that is too small to mean anything. */
export function makeMark(
  tool: Exclude<Tool, "pan">,
  id: string,
  a: [number, number],
  b: [number, number],
  opts: { width: number; text: string; color: string; path: [number, number][] },
): AnnotationItem | null {
  const base = { id, width: opts.width, color: opts.color };
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (tool === "text")
    return opts.text.trim()
      ? { ...base, type: "text", x: a[0], y: a[1], text: opts.text.trim() }
      : null;
  if (dist < 2 && tool !== "pen") return null;
  if (tool === "pen")
    return opts.path.length >= 2 ? { ...base, type: "pen", points: opts.path.slice(0, 400) } : null;
  if (tool === "circle")
    return {
      ...base,
      type: "circle",
      cx: a[0],
      cy: a[1],
      r: Math.max(1, Math.round(dist * 10) / 10),
    };
  if (tool === "arrow") return { ...base, type: "arrow", x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  return { ...base, type: "measure", x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
}

/** "20.5 mm" once the picture is calibrated; before that the length in viewer units ("56 px"). */
export function measureLabel(
  m: Extract<AnnotationItem, { type: "measure" }>,
  scale: FileAnnotations["scale"],
) {
  const r = measureLength(m, scale);
  return `${r.value} ${r.unit}`;
}

/** The scale from a line of known real length (the doctor types the mm). Null when it cannot be one. */
export function makeScale(
  line: { x1: number; y1: number; x2: number; y2: number },
  knownMm: number,
) {
  const lineUnits = Math.round(Math.hypot(line.x2 - line.x1, line.y2 - line.y1) * 100) / 100;
  if (!(knownMm > 0) || knownMm > 500 || lineUnits <= 0 || lineUnits > 500) return null;
  return { mmPerUnit: knownMm / lineUnits, knownMm, lineUnits };
}

/** Undo and redo of the marks: a list of snapshots and a position. */
export type Trail<T> = { past: T[]; present: T; future: T[] };
export const trail = <T>(present: T): Trail<T> => ({ past: [], present, future: [] });
export const push = <T>(t: Trail<T>, next: T): Trail<T> => ({
  past: [...t.past, t.present].slice(-50),
  present: next,
  future: [],
});
export const undo = <T>(t: Trail<T>): Trail<T> =>
  t.past.length === 0
    ? t
    : {
        past: t.past.slice(0, -1),
        present: t.past[t.past.length - 1] as T,
        future: [t.present, ...t.future],
      };
export const redo = <T>(t: Trail<T>): Trail<T> =>
  t.future.length === 0
    ? t
    : { past: [...t.past, t.present], present: t.future[0] as T, future: t.future.slice(1) };

/** Teeth tagged on the picture: add or take away one, kept sorted. */
export const toggleTooth = (list: number[], fdi: number) =>
  (list.includes(fdi) ? list.filter((t) => t !== fdi) : [...list, fdi]).sort((a, b) => a - b);
