import { areaOf, SESSION_TIMED_OUT } from "@clinic/shared";

export const TIMED_OUT_QUERY = "signed_out=timeout";

// Where a staff page goes when the server answers 401: the start page, which says why if the
// session timed out. Pages outside the staff app (start page, portal) stay where they are.
export function startPageAfter401(pathname: string, code: string): string | null {
  if (areaOf(pathname) !== "staff-app") return null;
  return code === SESSION_TIMED_OUT ? `/?${TIMED_OUT_QUERY}` : "/";
}
