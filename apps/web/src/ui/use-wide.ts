import { useEffect, useState } from "react";

/** True when the viewport is at least `minPx` wide. Follows resizes. */
export function useWide(minPx: number): boolean {
  const query = `(min-width: ${minPx}px)`;
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return wide;
}
