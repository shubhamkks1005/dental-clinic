import type { Parsed } from "./staff";

/** 6.5.2: POST /settings/:key/restore body. */
export function parseRestoreSetting(body: unknown): Parsed<{ auditId: string; version: number }> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Choose a change and send the current version." };
  }
  const auditId = "auditId" in body ? body.auditId : undefined;
  const version = "version" in body ? body.version : undefined;
  if (typeof auditId !== "string" || auditId.trim() === "") {
    return { ok: false, message: "Choose a change to restore." };
  }
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { ok: false, message: "Send the current version of this setting." };
  }
  return { ok: true, value: { auditId: auditId.trim(), version } };
}
