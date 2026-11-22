// The ONLY /api paths that answer without a staff session (owner decision, DECISIONS.md).
// The deny-by-default test checks every other registered route returns 401.
export const PUBLIC_API = [
  "/api/staff/auth/start",
  "/api/staff/auth/callback",
  "/api/staff/auth/branding",
  "/api/staff/health",
] as const;

export const SESSION_COOKIE = "staff_session";
export const FLOW_COOKIE = "staff_oauth";
