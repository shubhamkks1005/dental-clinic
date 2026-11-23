import { useEffect } from "react";
import { useOnline } from "./use-online";
import { useToast } from "./Toast";

export const OFFLINE_ACTION_REASON =
  "No internet connection. This needs the clinic server, so it is switched off until the connection is back. You are still on this page and what you typed is kept.";

/** Is this click one that needs the server: saving (submit or primary button) or opening another page? */
export function needsServer(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-offline-ok]")) return false;
  const link = target.closest("a[href]");
  if (link) {
    const href = link.getAttribute("href") ?? "";
    return href.startsWith("/app") || href.startsWith("/my");
  }
  const button = target.closest("button");
  return !!button && (button.type === "submit" || button.classList.contains("btn-primary"));
}

/**
 * Q1.6: while offline, keep the current screen. Server actions (Save, Finalise, opening another
 * page) are switched off and say why, instead of loading an empty page or failing silently.
 * Typing is never blocked. The look comes from html[data-offline] in ui.css.
 */
export function OfflineGuard() {
  const online = useOnline();
  const toast = useToast();

  useEffect(() => {
    const root = document.documentElement;
    if (online) {
      delete root.dataset.offline;
      return;
    }
    root.dataset.offline = "1";
    function onClick(event: MouseEvent) {
      if (!needsServer(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      toast({ text: OFFLINE_ACTION_REASON });
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      delete root.dataset.offline;
    };
  }, [online, toast]);

  return null;
}
