import { lastRequestId } from "../../api/last-request";

// 9.2.5: tell the clinic server when this browser hits an error. Sends only the error name, a
// short message, the screen path and the last Error ID. Never throws, never reports twice.
const MAX_PER_SESSION = 20;
const seen = new Set<string>();

export type ErrorLike = { name?: unknown; message?: unknown };

export function toReport(err: unknown, path: string) {
  const e = (typeof err === "object" && err !== null ? err : {}) as ErrorLike;
  const kind =
    typeof e.name === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,59}$/.test(e.name) ? e.name : "Error";
  const raw =
    typeof e.message === "string" ? e.message : typeof err === "string" ? err : "Unknown error";
  const id = lastRequestId();
  return {
    kind,
    message: raw.replace(/\s+/g, " ").trim().slice(0, 200) || "Unknown error",
    path: path.slice(0, 200),
    ...(id && id.length >= 6 ? { requestId: id } : {}),
  };
}

/** True if this error was new and a report was sent. */
export function reportBrowserError(err: unknown): boolean {
  try {
    const report = toReport(err, window.location.pathname);
    const key = `${report.kind}|${report.message}|${report.path}`;
    if (seen.has(key) || seen.size >= MAX_PER_SESSION) return false;
    seen.add(key);
    void fetch("/api/staff/errors", {
      method: "POST",
      headers: { "content-type": "application/json", "x-clinic-request": "1" },
      credentials: "same-origin",
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

export function resetReportedErrorsForTest(): void {
  seen.clear();
}

let installed = false;

/** window "error" and "unhandledrejection" (the React crash page calls reportBrowserError too). */
export function installErrorReporter(): void {
  if (installed) return;
  installed = true;
  window.addEventListener("error", (event) => reportBrowserError(event.error ?? event.message));
  window.addEventListener("unhandledrejection", (event) => reportBrowserError(event.reason));
}
