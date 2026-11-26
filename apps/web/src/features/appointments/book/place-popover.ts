// Where the booking popover sits (HTML 897-949): next to the clicked cell, 12 px gap; columns
// Thu-Sun open to the LEFT, Mon-Wed to the RIGHT, falling back to the other side when there is
// no room; top = cell top - 24; clamped 12 px inside the window. No cell: centred.
// L32: in the day view (one column) the side with more room wins.
export type Rect = { left: number; top: number; right: number; width: number; height: number };
export type Size = { width: number; height: number };

const GAP = 12;
const MARGIN = 12;

export function placePopover(
  anchor: Rect | null,
  pop: Size,
  view: Size,
  side: "left" | "right" | "auto",
): { left: number; top: number } {
  let left: number;
  let top: number;
  if (!anchor) {
    left = (view.width - pop.width) / 2;
    top = (view.height - pop.height) / 2;
  } else {
    const toLeft = anchor.left - pop.width - GAP;
    const toRight = anchor.right + GAP;
    const want =
      side === "auto" ? (anchor.left > view.width - anchor.right ? "left" : "right") : side;
    if (want === "left") left = toLeft < MARGIN ? toRight : toLeft;
    else left = toRight + pop.width > view.width - MARGIN ? toLeft : toRight;
    top = anchor.top - 24;
  }
  return {
    left: Math.round(Math.max(MARGIN, Math.min(view.width - pop.width - MARGIN, left))),
    top: Math.round(Math.max(MARGIN, Math.min(view.height - pop.height - MARGIN, top))),
  };
}

/** HTML 922: Thursday and later (Mon = 0) open to the left. */
export const sideForColumn = (index: number, columns: number): "left" | "right" | "auto" =>
  columns === 1 ? "auto" : index >= 3 ? "left" : "right";
