import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

// Prescription preview size (owner 2026-11-27, review Q6): opens at true A4 size (100 %); the
// doctor resizes from the right edge, the bottom edge or the corner (HTML 1412-1441: delta/420,
// clamp 0.7-1.3, no transition). The % chip resets to 100 %. Remembered per browser.
const KEY = "vf.rxScale";
const clamp = (n: number) => Math.min(1.3, Math.max(0.7, Math.round(n * 100) / 100));

function stored(): number {
  try {
    const v = Number(window.localStorage.getItem(KEY));
    return v >= 0.7 && v <= 1.3 ? v : 1;
  } catch {
    return 1;
  }
}

export type Axis = "x" | "y" | "xy";

export function useSheetZoom() {
  const [scale, setScaleState] = useState(stored);
  const drag = useRef<{ x: number; y: number; start: number; axis: Axis } | null>(null);

  const setScale = useCallback((n: number) => {
    const v = clamp(n);
    setScaleState(v);
    try {
      window.localStorage.setItem(KEY, String(v));
    } catch {
      /* private window: the size is just not remembered */
    }
  }, []);

  const handle = (axis: Axis) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, start: scale, axis };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d) return;
      const dx = d.axis === "y" ? 0 : e.clientX - d.x;
      const dy = d.axis === "x" ? 0 : e.clientY - d.y;
      setScale(d.start + (dx + dy) / 420);
    },
    onPointerUp: () => {
      drag.current = null;
    },
    onPointerCancel: () => {
      drag.current = null;
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setScale(scale + 0.05);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setScale(scale - 0.05);
    },
  });

  return { scale, reset: () => setScale(1), handle };
}
