import { useEffect, useRef } from "react";
import { shouldPollWhenVisible } from "./visible-interval";

/**
 * Call `tick` every `ms` while the document is visible; pause when the tab is hidden (2.4.7).
 */
export function useVisibleInterval(tick: () => void, ms: number, enabled = true): void {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!enabled || ms <= 0) return;

    let id: number | null = null;

    const clear = () => {
      if (id !== null) {
        window.clearInterval(id);
        id = null;
      }
    };

    const start = () => {
      clear();
      id = window.setInterval(() => tickRef.current(), ms);
    };

    const onVisibility = () => {
      if (shouldPollWhenVisible(document.visibilityState)) {
        tickRef.current();
        start();
      } else {
        clear();
      }
    };

    if (shouldPollWhenVisible(document.visibilityState)) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ms, enabled]);
}
