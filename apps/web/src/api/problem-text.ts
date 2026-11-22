import { ApiError } from "./client";

export const OFFLINE_TEXT =
  "Cannot reach the clinic server. Check the internet connection, then try again.";

// The one sentence staff see when a call fails (1.4.7). The server's plain message, plus the
// Error ID when the server itself failed, so the receptionist can read it to the developer.
// Input mistakes and refusals (4xx) need no ID.
export function problemText(err: unknown): string {
  if (!(err instanceof ApiError)) return OFFLINE_TEXT;
  const serverFault = err.status >= 500 || err.code === "bad_reply";
  return serverFault && err.errorId ? `${err.message} Error ID: ${err.errorId}.` : err.message;
}
