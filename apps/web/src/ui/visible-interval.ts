/** Staff Today / Appointments poll while the tab is open (2.4.7). */
export const AUTO_REFRESH_MS = 60_000;

export function shouldPollWhenVisible(visibilityState: string): boolean {
  return visibilityState === "visible";
}
