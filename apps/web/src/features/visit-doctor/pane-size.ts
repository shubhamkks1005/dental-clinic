// Size rules of the resizable side pane (design: setRxWidth / setRxHeight). Pure, so they are tested.

export const PANE_DEFAULT_W = 460;
const MIN_W = 280;
const MIN_H = 260;
const MAX_H = 920;

/** Width in px: at least 280, at most 680 and never so wide that the left side drops under 420. */
export function clampPaneWidth(px: number, mainWidth: number): number {
  const max = Math.max(320, Math.min(680, mainWidth - 420));
  return Math.max(MIN_W, Math.min(max, px));
}

export function clampPaneHeight(px: number): number {
  return Math.max(MIN_H, Math.min(MAX_H, px));
}
