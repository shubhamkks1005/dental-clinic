import type { ApiReply } from "@clinic/shared";

// The one typed API client. Feature folders wrap it in small functions; components never fetch.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
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
  const reply = (await response.json().catch(() => null)) as ApiReply<T> | null;
  if (!reply) {
    throw new ApiError(
      response.status,
      "bad_reply",
      "The clinic server sent an unexpected reply. Please try again.",
    );
  }
  if (!reply.ok) throw new ApiError(response.status, reply.error.code, reply.error.message);
  return reply.data;
}
