import { useState } from "react";

// Copies a short text (an Error ID) to the clipboard. Never throws; says so if it cannot copy.
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
  }
  return (
    <button type="button" className="btn" onClick={copy} aria-live="polite">
      {state === "done" ? "Copied" : state === "failed" ? "Select and copy by hand" : label}
    </button>
  );
}
