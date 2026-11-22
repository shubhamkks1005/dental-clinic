import { useEffect, useId, useRef, type ReactNode } from "react";
import "./dialog.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // "alertdialog" for questions that need an answer (confirm): no closing by clicking outside.
  role?: "dialog" | "alertdialog";
};

// 1.4.2: modal dialog on the browser's own <dialog> (focus stays inside, the page behind is
// inert, Esc closes). Not Radix: its scroll lock injects a <style> tag our CSP blocks.
export function Dialog({ open, onClose, title, children, role = "dialog" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
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
      className="dialog"
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      onClose={handleClose}
      onClick={(e) => {
        // A click on the dimmed area outside the box lands on <dialog> itself.
        if (role === "dialog" && e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="dialog-body">
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
