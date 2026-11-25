import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * FLIP for the list (docs/design/final/doctor_today.html `flipReorder`): whenever the order key
 * changes, every row that moved slides from its old place to the new one. A lifted row keeps its
 * scale while it glides. No movement with prefers-reduced-motion.
 *
 * Positions are read with offsetTop (the row's place in the layout, not where an animation has
 * drawn it) and refreshed after EVERY render. Reading them from the screen while another move was
 * still drawn made the next glide start from the wrong place, so every second move looked off.
 */
export function useFlip(list: RefObject<HTMLElement | null>, orderKey: string) {
  const tops = useRef(new Map<string, number>());
  const lastKey = useRef(orderKey);
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const rows = [...el.querySelectorAll<HTMLElement>("[data-row-id]")];
    const now = new Map(rows.map((r) => [r.dataset.rowId ?? "", r.offsetTop]));
    if (lastKey.current !== orderKey) {
      lastKey.current = orderKey;
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const moved: HTMLElement[] = [];
      for (const row of rows) {
        const id = row.dataset.rowId ?? "";
        const before = tops.current.get(id);
        const delta = before === undefined ? 0 : before - (now.get(id) ?? 0);
        if (!reduce && delta !== 0) {
          const lifted = row.classList.contains("is-lifted");
          row.style.transition = "none";
          row.style.transform = lifted
            ? `translateY(${delta - 4}px) scale(1.022)`
            : `translateY(${delta}px)`;
          moved.push(row);
        }
      }
      if (moved.length > 0) {
        void el.offsetHeight;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            for (const row of moved) {
              row.style.transition = "";
              row.style.transform = "";
            }
          }),
        );
      }
    }
    tops.current = now;
  });
}
