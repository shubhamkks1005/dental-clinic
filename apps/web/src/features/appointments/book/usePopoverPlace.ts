import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { POP_HIDDEN_TRANSFORM, reducedMotion } from "./motion";
import { placePopover } from "./place-popover";

export type Anchor = { el: HTMLElement | null; side: "left" | "right" | "auto" };

// Placement (P5.7.2, M24) and the open / close motion (M1-M3) of the booking popover.
export function usePopoverPlace(pop: RefObject<HTMLDivElement | null>, first: Anchor) {
  const anchor = useRef<Anchor>(first);
  const [entered, setEntered] = useState(false);

  const place = useCallback(() => {
    const el = pop.current;
    if (!el) return;
    const a = anchor.current.el?.isConnected ? anchor.current.el.getBoundingClientRect() : null;
    const p = placePopover(
      a,
      {
        width: el.offsetWidth || 440,
        height: el.offsetHeight || Math.min(540, window.innerHeight - 24),
      },
      { width: window.innerWidth, height: window.innerHeight },
      anchor.current.side,
    );
    el.style.left = `${p.left}px`;
    el.style.top = `${p.top}px`;
  }, [pop]);

  // M1: start at scale .96 + 6 px down and transparent, then the end style on the next frame.
  useLayoutEffect(() => {
    const el = pop.current;
    if (!el) return;
    place();
    if (reducedMotion()) {
      setEntered(true);
      return;
    }
    el.style.transform = POP_HIDDEN_TRANSFORM;
    el.style.opacity = "0";
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [place, pop]);

  useEffect(() => {
    const el = pop.current;
    if (!el || !entered) return;
    el.style.transform = "scale(1) translateY(0)";
    el.style.opacity = "1";
  }, [entered, pop]);

  useEffect(() => {
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [place]);

  /** The date or time moved the target cell (HTML 1115). */
  const retarget = useCallback(
    (next: Anchor | null) => {
      if (!next) return;
      anchor.current = next;
      place();
    },
    [place],
  );

  /** M3: back to the start style; the caller unmounts after POP_EXIT_MS. */
  const leave = useCallback(() => {
    const el = pop.current;
    setEntered(false);
    if (!el) return;
    el.style.transform = POP_HIDDEN_TRANSFORM;
    el.style.opacity = "0";
  }, [pop]);

  return { entered, place, retarget, leave };
}
