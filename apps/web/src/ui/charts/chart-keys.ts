/** Keyboard focus for chart points (6.3.2): arrows move; Home/End jump. */

export function moveChartFocus(current: number, key: string, count: number, cols = 0): number {
  if (count <= 0) return 0;
  const i = Math.min(Math.max(current, 0), count - 1);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (cols > 0) {
    if (key === "ArrowRight") return Math.min(i + 1, count - 1);
    if (key === "ArrowLeft") return Math.max(i - 1, 0);
    if (key === "ArrowDown") return Math.min(i + cols, count - 1);
    if (key === "ArrowUp") return Math.max(i - cols, 0);
    return i;
  }
  if (key === "ArrowRight" || key === "ArrowDown") return Math.min(i + 1, count - 1);
  if (key === "ArrowLeft" || key === "ArrowUp") return Math.max(i - 1, 0);
  return i;
}

export function chartPointLabel(label: string, value: number, unit = ""): string {
  const u = unit ? ` ${unit}` : "";
  return `${label}: ${value}${u}`;
}
