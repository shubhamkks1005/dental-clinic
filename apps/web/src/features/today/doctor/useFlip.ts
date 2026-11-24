import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * FLIP for the list (docs/design/final/doctor_today.html `flipReorder`): whenever the order key
 * changes, every row that moved slides from its old place to the new one. A lifted row keeps its
 * scale while it glides. No movement with prefers-reduced-motion.
 */
export function useFlip(list: RefObject<HTMLElement | null>, orderKey: string) {
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const rows = [...el.querySelectorAll<HTMLElement>("[data-row-id]")];
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const moved: HTMLElement[] = [];
    for (const row of rows) {
      const before = tops.current.get(row.dataset.rowId ?? "");
      const delta = before === undefined ? 0 : before - row.getBoundingClientRect().top;
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
    tops.current = new Map(rows.map((r) => [r.dataset.rowId ?? "", r.getBoundingClientRect().top]));
  }, [list, orderKey]);
}
