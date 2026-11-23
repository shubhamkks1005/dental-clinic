import { REQUEST_ID_HEADER, shortRequestId, type ApiReply } from "@clinic/shared";
import { recordRequestId } from "./last-request";
import { startPageAfter401 } from "./session-end";

// The one typed API client. Feature folders wrap it in small functions; components never fetch.
// errorId: the short "Error ID" of the request (from the X-Request-Id reply header), if any.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly errorId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T>(
  path: string,
  init: { method?: Method; body?: unknown } = {},
): Promise<T> {
  const method = init.method ?? "GET";
  const headers: Record<string, string> = { accept: "application/json" };
  // The Worker's CSRF guard requires this header on every state-changing call.
  if (method !== "GET") headers["x-clinic-request"] = "1";
  if (init.body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const requestId = response.headers.get(REQUEST_ID_HEADER);
  const errorId = requestId ? shortRequestId(requestId) : null;
  recordRequestId(errorId);
  const reply = (await response.json().catch(() => null)) as ApiReply<T> | null;
  if (!reply) {
    throw new ApiError(
      response.status,
      "bad_reply",
      "The clinic server sent an unexpected reply. Please try again.",
      errorId,
    );
  }
  if (!reply.ok) {
    if (response.status === 401) {
      const target = startPageAfter401(window.location.pathname, reply.error.code);
      if (target) window.location.replace(target);
    }
    throw new ApiError(response.status, reply.error.code, reply.error.message, errorId);
  }
  return reply.data;
}

/** Multipart upload (do not set content-type — browser sets the boundary). */
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-clinic-request": "1",
  };
  const response = await fetch(path, {
    method: "POST",
    headers,
    credentials: "same-origin",
    body: form,
  });
  const requestId = response.headers.get(REQUEST_ID_HEADER);
  const errorId = requestId ? shortRequestId(requestId) : null;
  recordRequestId(errorId);
  const reply = (await response.json().catch(() => null)) as ApiReply<T> | null;
  if (!reply) {
    throw new ApiError(
      response.status,
      "bad_reply",
      "The clinic server sent an unexpected reply. Please try again.",
      errorId,
    );
  }
  if (!reply.ok) {
    if (response.status === 401) {
      const target = startPageAfter401(window.location.pathname, reply.error.code);
      if (target) window.location.replace(target);
    }
    throw new ApiError(response.status, reply.error.code, reply.error.message, errorId);
  }
  return reply.data;
}
