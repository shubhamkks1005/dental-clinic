import { tunableDefault } from "@clinic/shared";

/** 2.4.7 / 6.5.3: default poll interval from TUNABLES (settings override in screens). */
export const AUTO_REFRESH_MS = tunableDefault("ui.auto_refresh_seconds") * 1000;

export function shouldPollWhenVisible(visibilityState: DocumentVisibilityState): boolean {
  return visibilityState === "visible";
}
