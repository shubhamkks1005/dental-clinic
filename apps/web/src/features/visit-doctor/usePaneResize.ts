import { useRef, useState } from "react";
import { PANE_DEFAULT_W, clampPaneHeight, clampPaneWidth } from "./pane-size";

type Mode = "h" | "v" | "both";

/** Drag handles of the side pane: sideways, down, or the corner; double-click puts it back. */
export function usePaneResize(
  main: React.RefObject<HTMLElement | null>,
  pane: React.RefObject<HTMLElement | null>,
) {
  const [width, setWidth] = useState(PANE_DEFAULT_W);
  const [height, setHeight] = useState<number | null>(null);
  const mode = useRef<Mode | null>(null);

  function start(m: Mode) {
    return (e: React.PointerEvent<HTMLElement>) => {
      if (window.innerWidth < 1024) return;
      mode.current = m;
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.userSelect = "none";
    };
  }
  function move(e: React.PointerEvent<HTMLElement>) {
    const m = mode.current;
    const mainEl = main.current;
    const paneEl = pane.current;
    if (!m || !mainEl || !paneEl) return;
    if (m === "h" || m === "both") {
      setWidth(
        clampPaneWidth(mainEl.getBoundingClientRect().right - e.clientX - 24, mainEl.clientWidth),
      );
    }
    if (m === "v" || m === "both") {
      setHeight(clampPaneHeight(e.clientY - paneEl.getBoundingClientRect().top));
    }
  }
  function stop() {
    mode.current = null;
    document.body.style.userSelect = "";
  }
  const handle = (m: Mode, reset: () => void) => ({
    onPointerDown: start(m),
    onPointerMove: move,
    onPointerUp: stop,
    onPointerCancel: stop,
    onDoubleClick: reset,
  });

  return {
    width,
    height,
    sideways: handle("h", () => setWidth(PANE_DEFAULT_W)),
    down: handle("v", () => setHeight(null)),
    corner: handle("both", () => {
      setWidth(PANE_DEFAULT_W);
      setHeight(null);
    }),
  };
}
