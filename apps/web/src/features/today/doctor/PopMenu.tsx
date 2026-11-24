import { useEffect, useRef, type ReactNode } from "react";

export type PopItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  tone?: "danger";
  right?: string;
  disabled?: boolean;
  divider?: boolean;
  onSelect: () => void;
};

type Props = {
  label: string;
  open: boolean;
  /** The button that opened it: the menu sits under it (or above when there is no room). */
  anchor: HTMLElement | null;
  items: PopItem[];
  onClose: () => void;
};

const WIDTH = 224;
const ITEM_HEIGHT = 40;

/**
 * The small menu of the doctor's Today (row "..." and "Take a break"): opens with the design's
 * scale-and-fade, upwards when it would run off the bottom, arrows move, Esc closes and focus
 * returns to the button that opened it.
 */
export function PopMenu({ label, open, anchor, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      anchor?.focus();
    }
    // The anchor is read only to return focus.
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor?.contains(t)) onClose();
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open, anchor, onClose]);

  function keys(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const buttons = [
      ...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []),
    ];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? at + 1 : at - 1;
    buttons[(next + buttons.length) % buttons.length]?.focus();
  }

  const rect = anchor?.getBoundingClientRect();
  const height = items.length * ITEM_HEIGHT + 16;
  const up = rect ? rect.bottom + height > window.innerHeight : false;
  const style = rect
    ? {
        top: up ? Math.max(16, rect.top - height - 6) : rect.bottom + 6,
        left: Math.max(16, Math.min(rect.right - WIDTH, window.innerWidth - WIDTH - 16)),
      }
    : undefined;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      aria-hidden={!open}
      className={`td-menu ${up ? "menu-up" : "menu-down"}${open ? " is-open" : ""}`}
      style={style}
      onKeyDown={keys}
    >
      {items.map((item) => (
        <div key={item.key} role="none">
          {item.divider ? <div className="td-menu-divider" role="separator" /> : null}
          <button
            type="button"
            role="menuitem"
            className={`td-menu-item${item.tone === "danger" ? " is-danger" : ""}`}
            disabled={item.disabled}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
          >
            {item.icon ? (
              <span className="td-menu-icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span>{item.label}</span>
            {item.right ? <span className="td-menu-right">{item.right}</span> : null}
          </button>
        </div>
      ))}
    </div>
  );
}
