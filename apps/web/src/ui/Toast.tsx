import * as RadixToast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import "./toast.css";

export type ToastInput = {
  text: string;
  tone?: "ok" | "error";
  /** Optional link shown after the text (opens in a new tab), e.g. Print. */
  link?: { label: string; href: string };
  /** A button after the text (for example Undo). The toast stays 10 seconds when it has one. */
  action?: { label: string; onClick: () => void };
};
type ShownToast = ToastInput & { tone: "ok" | "error"; id: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});
let nextId = 1;

// 1.4.6 toasts (Radix): short news after an action ("Saved."), read out by screen readers,
// swipe or the X to dismiss, F8 jumps to them. Errors stay longer and are announced at once.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ShownToast[]>([]);
  const show = useCallback((toast: ToastInput) => {
    setToasts((list) => [...list, { tone: "ok", ...toast, id: nextId++ }]);
  }, []);
  const remove = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={show}>
      <RadixToast.Provider label="Notifications" swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            className={`toast toast-${t.tone}`}
            type={t.tone === "error" ? "foreground" : "background"}
            duration={t.tone === "error" || t.action ? 10000 : 5000}
            onOpenChange={(open) => !open && remove(t.id)}
          >
            <RadixToast.Description className="toast-text">
              {t.text}
              {t.link ? (
                <>
                  {" "}
                  <a className="toast-link" href={t.link.href} target="_blank" rel="noreferrer">
                    {t.link.label}
                  </a>
                </>
              ) : null}
              {t.action ? (
                <RadixToast.Action altText={t.action.label} asChild>
                  <button
                    type="button"
                    className="toast-link toast-action"
                    onClick={t.action.onClick}
                  >
                    {t.action.label}
                  </button>
                </RadixToast.Action>
              ) : null}
            </RadixToast.Description>
            <RadixToast.Close className="toast-close" aria-label="Dismiss">
              ×
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="toast-viewport" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
