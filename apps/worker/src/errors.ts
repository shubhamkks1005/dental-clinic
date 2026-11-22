import { RepoError } from "@clinic/db";
import { fail, type ApiReply } from "@clinic/shared";

const STATUS = {
  invalid: 400,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  not_allowed: 422,
} as const;

const UNEXPECTED =
  "Something went wrong. Please try again. If it keeps happening, tell the developer.";

export type ErrorReply = { status: 400 | 403 | 404 | 409 | 422 | 500; body: ApiReply<never> };

// Repository errors keep their plain-sentence message; anything else becomes a generic 500
// so no internal detail (or patient data inside an error message) reaches the screen.
export function errorReply(err: unknown): ErrorReply {
  if (err instanceof RepoError)
    return { status: STATUS[err.code], body: fail(err.code, err.message) };
  return { status: 500, body: fail("server_error", UNEXPECTED) };
}
