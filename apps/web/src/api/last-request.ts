// The Error ID of the most recent server reply, so staff can copy it into a bug report.
// Kept in memory only (never stored, never sent anywhere).
let last: string | null = null;

export function recordRequestId(errorId: string | null): void {
  if (errorId) last = errorId;
}

export function lastRequestId(): string | null {
  return last;
}
