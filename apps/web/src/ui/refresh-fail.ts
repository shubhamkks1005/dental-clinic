export const REFRESH_FAILED_NOTE = "Couldn't refresh. Showing the last list.";

/**
 * What to do when a load fails (speed rule 8). If data is already on screen, keep it and show a
 * short note; the caller clears the note on the next good load. With no data, show the real error.
 */
export function refreshFailure(
  hasData: boolean,
  errorMessage: string,
): { keepData: boolean; error: string } {
  return hasData
    ? { keepData: true, error: REFRESH_FAILED_NOTE }
    : { keepData: false, error: errorMessage };
}
