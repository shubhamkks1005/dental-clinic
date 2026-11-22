import { useCallback, useRef, useState } from "react";

// 1.4.6 double-click guard: while one save is running, more clicks do nothing. (The server-side
// guard, an idempotency key, comes with bills in Phase 5.)
export function createSubmitGuard() {
  let running = false;
  return async function once<T>(work: () => Promise<T>): Promise<T | undefined> {
    if (running) return undefined;
    running = true;
    try {
      return await work();
    } finally {
      running = false;
    }
  };
}

// The same for a component: run(work) plus `pending` to disable the button and show "Saving...".
export function useSubmitOnce() {
  const guard = useRef(createSubmitGuard());
  const [pending, setPending] = useState(false);
  const run = useCallback(async <T>(work: () => Promise<T>) => {
    return guard.current(async () => {
      setPending(true);
      try {
        return await work();
      } finally {
        setPending(false);
      }
    });
  }, []);
  return { run, pending };
}
