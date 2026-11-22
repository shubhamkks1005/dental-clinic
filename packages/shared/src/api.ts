export type ApiError = { code: string; message: string };

// 401 code when a staff session ended by the idle (60 min) or absolute (12 h) limit.
export const SESSION_TIMED_OUT = "session_timed_out";

export type ApiReply<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export function ok<T>(data: T): ApiReply<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string): ApiReply<never> {
  return { ok: false, error: { code, message } };
}
