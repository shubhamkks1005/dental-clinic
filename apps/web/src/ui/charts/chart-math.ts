/** Pure layout helpers for small SVG charts (6.3.2). No DOM. */

export type ChartDatum = { label: string; value: number };
export type StackedDatum = { label: string; parts: { key: string; value: number }[] };
export type HeatCell = { row: string; col: string; value: number };

export function maxValue(values: number[]): number {
  let m = 0;
  for (const v of values) if (v > m) m = v;
  return m;
}

/** Nice y-max: at least 1, rounded up to a friendly step. */
export function niceMax(raw: number): number {
  if (raw <= 0) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = 10 ** exp;
  const n = raw / base;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * base;
}

export function barLayout(
  data: ChartDatum[],
  width: number,
  height: number,
  pad = { top: 16, right: 8, bottom: 28, left: 36 },
) {
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const max = niceMax(maxValue(data.map((d) => d.value)));
  const gap = Math.min(8, innerW / Math.max(data.length, 1) / 4);
  const barW = Math.max(4, (innerW - gap * (data.length + 1)) / Math.max(data.length, 1));
  const bars = data.map((d, i) => {
    const h = max === 0 ? 0 : (d.value / max) * innerH;
    const x = pad.left + gap + i * (barW + gap);
    const y = pad.top + innerH - h;
    return { ...d, x, y, width: barW, height: h, index: i };
  });
  return { bars, max, pad, innerW, innerH };
}

export function stackedLayout(
  data: StackedDatum[],
  keys: string[],
  width: number,
  height: number,
  pad = { top: 16, right: 8, bottom: 28, left: 36 },
) {
  const totals = data.map((d) => d.parts.reduce((s, p) => s + p.value, 0));
  const max = niceMax(maxValue(totals));
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const gap = Math.min(8, innerW / Math.max(data.length, 1) / 4);
  const barW = Math.max(4, (innerW - gap * (data.length + 1)) / Math.max(data.length, 1));
  const columns = data.map((d, i) => {
    const x = pad.left + gap + i * (barW + gap);
    let y = pad.top + innerH;
    const segments = keys.map((key) => {
      const value = d.parts.find((p) => p.key === key)?.value ?? 0;
      const h = max === 0 ? 0 : (value / max) * innerH;
      y -= h;
      return { key, value, x, y, width: barW, height: h };
    });
    return { label: d.label, index: i, segments };
  });
  return { columns, max, pad, keys };
}

export function linePath(
  data: ChartDatum[],
  width: number,
  height: number,
  pad = { top: 16, right: 12, bottom: 28, left: 36 },
): {
  d: string;
  points: { x: number; y: number; label: string; value: number; index: number }[];
  max: number;
} {
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const max = niceMax(maxValue(data.map((d) => d.value)));
  const n = Math.max(data.length - 1, 1);
  const points = data.map((d, i) => {
    const x = pad.left + (i / n) * innerW;
    const y = pad.top + innerH - (max === 0 ? 0 : (d.value / max) * innerH);
    return { x, y, label: d.label, value: d.value, index: i };
  });
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  return { d, points, max };
}

export function sparkPath(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const max = niceMax(maxValue(values));
  const n = Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = (i / n) * width;
      const y = height - (max === 0 ? 0 : (v / max) * height);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function heatGrid(cells: HeatCell[]): {
  rows: string[];
  cols: string[];
  max: number;
  matrix: number[][];
} {
  const rows = [...new Set(cells.map((c) => c.row))];
  const cols = [...new Set(cells.map((c) => c.col))];
  const lookup = new Map(cells.map((c) => [`${c.row}\0${c.col}`, c.value]));
  const matrix = rows.map((r) => cols.map((c) => lookup.get(`${r}\0${c}`) ?? 0));
  const max = niceMax(maxValue(matrix.flat()));
  return { rows, cols, max, matrix };
}

/** Series colours from DESIGN tokens (CSS vars referenced in components). */
export const CHART_SERIES = [
  { key: "a", css: "var(--blue)", pattern: "solid" as const },
  { key: "b", css: "var(--teal)", pattern: "hatch" as const },
  { key: "c", css: "var(--navy)", pattern: "dots" as const },
  { key: "d", css: "var(--warning-text)", pattern: "diag" as const },
];
