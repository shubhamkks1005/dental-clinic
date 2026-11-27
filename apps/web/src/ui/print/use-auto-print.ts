import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

// "Download" on the visit finished page opens a print screen with ?download=1: the print dialog
// opens by itself once the sheet is ready, and the user picks "Save as PDF" (no server PDF, AGENTS).
// The page title (printTitle) becomes the file name.
export function useAutoPrint(ready: boolean, print: () => void | Promise<void>) {
  const [params] = useSearchParams();
  const done = useRef(false);
  const wanted = params.get("download") === "1";
  useEffect(() => {
    if (!wanted || !ready || done.current) return;
    done.current = true;
    void print();
  }, [wanted, ready, print]);
}
