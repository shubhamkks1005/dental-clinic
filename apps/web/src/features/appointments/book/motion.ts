// Motion of the booking popover, with the HTML's exact numbers (handoff section 3).
export const POP_OPEN_TRANSITION =
  "transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease";
export const POP_HIDDEN_TRANSFORM = "scale(0.96) translateY(6px)";
export const POP_EXIT_MS = 180; // M3
export const MORPH_MS = 500; // M7
export const MORPH_UNMOUNT_MS = 510; // M8
export const FLYER = { slideAt: 320, dockAt: 760, doneAt: 1050, toastOutAt: 3500 }; // M15-M20

export const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/** M7 (HTML 1193-1209): the popover folds into the new card. Measures both, then transforms the
 * popover from its top-left corner; the caller unmounts it at MORPH_UNMOUNT_MS. */
export function foldInto(popover: HTMLElement, target: DOMRect): void {
  const from = popover.getBoundingClientRect();
  const dx = target.left - from.left;
  const dy = target.top - from.top;
  const scaleX = Math.max(0.18, target.width / from.width);
  const targetH = Math.max(48, Math.min(target.height, 90));
  const scaleY = Math.max(0.12, targetH / from.height);
  popover.style.transition =
    "transform 500ms cubic-bezier(0.2, 0.9, 0.3, 1.0), opacity 480ms ease, border-radius 450ms ease";
  popover.style.transformOrigin = "top left";
  popover.style.transform = `translate3d(${Math.round(dx)}px, ${Math.round(dy)}px, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
  popover.style.opacity = "0.9";
  popover.style.borderRadius = "8px";
}

/** One list of timers per sequence (HTML 808-818), cleared on unmount or a new sequence. */
export function timerList() {
  const ids: number[] = [];
  return {
    at(ms: number, fn: () => void) {
      ids.push(window.setTimeout(fn, ms));
    },
    clear() {
      for (const id of ids.splice(0)) window.clearTimeout(id);
    },
  };
}

/**
 * M10 / M20: the calendar's small toast (HTML 487): a dark pill at the top centre, 300 ms in,
 * shown `visibleMs`, 300 ms out. Lives on document.body with the scope class, so it outlives the
 * popover that started it (it shows after the popover has gone).
 */
export function showCalToast(fill: (box: HTMLElement) => void, visibleMs: number): () => void {
  // One toast at a time, like the HTML's single toast element (HTML 487).
  for (const old of document.querySelectorAll(".cal-toast")) old.remove();
  const box = document.createElement("div");
  box.className = "cal-scope cal-toast";
  box.setAttribute("role", "status");
  fill(box);
  document.body.appendChild(box);
  const reduce = reducedMotion();
  requestAnimationFrame(() => box.classList.add("is-in"));
  const out = window.setTimeout(() => {
    box.classList.remove("is-in");
    window.setTimeout(() => box.remove(), reduce ? 0 : 300);
  }, visibleMs);
  return () => {
    window.clearTimeout(out);
    box.remove();
  };
}

/** Text with a leading icon tile or code chip, built without innerHTML (names are user text). */
export function toastContent(
  box: HTMLElement,
  parts: { chip?: string; icon?: boolean; text: string[] },
) {
  if (parts.icon) {
    const tick = document.createElement("span");
    tick.className = "cal-toast-tick";
    tick.textContent = "✓";
    tick.setAttribute("aria-hidden", "true");
    box.appendChild(tick);
  }
  if (parts.chip) {
    const chip = document.createElement("span");
    chip.className = "cal-toast-chip";
    chip.textContent = parts.chip;
    box.appendChild(chip);
  }
  const text = document.createElement("span");
  text.className = "cal-toast-text";
  text.textContent = parts.text.join(" · ");
  box.appendChild(text);
}
