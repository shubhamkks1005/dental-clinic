export type ApiError = { code: string; message: string };

export type ApiReply<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export function ok<T>(data: T): ApiReply<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string): ApiReply<never> {
  return { ok: false, error: { code, message } };
}
