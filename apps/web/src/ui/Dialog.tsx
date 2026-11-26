import { useEffect, useId, useRef, type ReactNode } from "react";
import "./dialog.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // "alertdialog" for questions that need an answer (confirm): no closing by clicking outside.
  role?: "dialog" | "alertdialog";
  /** "drawer" slides in from the right edge (see Drawer.tsx). */
  variant?: "center" | "drawer";
  /** Extra class on the <dialog> (a page's design scope, e.g. "library-doc"). */
  className?: string;
  /** Asked before Esc or an outside click closes it; false keeps it open (unsaved changes). */
  beforeClose?: () => boolean;
};

// 1.4.2: modal dialog on the browser's own <dialog> (focus stays inside, the page behind is
// inert, Esc closes). Not Radix: its scroll lock injects a <style> tag our CSP blocks.
export function Dialog({
  open,
  onClose,
  title,
  children,
  role = "dialog",
  variant = "center",
  className,
  beforeClose,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      const { scrollX, scrollY } = window;
      dialog.showModal();
      // The browser focuses the first control and can scroll the page to it: put the page back.
      window.scrollTo(scrollX, scrollY);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    // Put focus back on the button that opened the dialog.
    if (opener.current instanceof HTMLElement) opener.current.focus();
    onClose();
  }

  return (
    <dialog
      ref={ref}
      className={[variant === "drawer" ? "dialog dialog-drawer" : "dialog", className]
        .filter(Boolean)
        .join(" ")}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={(e) => {
        if (beforeClose && !beforeClose()) e.preventDefault();
      }}
      onClick={(e) => {
        // A click on the dimmed area outside the box lands on <dialog> itself.
        if (role !== "dialog" || e.target !== e.currentTarget) return;
        if (!beforeClose || beforeClose()) e.currentTarget.close();
      }}
    >
      <div className="dialog-body">
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
