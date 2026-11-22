// 1.6.1 structured logs: one JSON line per event. Never put patient name, mobile or diagnosis
// in a log. Real change history stays in audit_log (Workers Logs keep only a few days).

const BANNED =
  /^(name|first_?name|last_?name|full_?name|mobile|phone|diagnosis|diagnoses|patient|patient_?id|patient_?name|email|note|notes|message|body|query)$/i;

export type LogFields = Record<string, unknown>;

/** Drop keys that could carry patient health or contact data, including nested objects. */
export function sanitizeLog(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (BANNED.test(key) || /patient|mobile|diagnos|phone/i.test(key)) continue;
    out[key] =
      value !== null && typeof value === "object" && !Array.isArray(value)
        ? sanitizeLog(value as LogFields)
        : value;
  }
  return out;
}

/** Pathname only: search strings can hold a patient name. */
export function requestPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "/";
  }
}

export function writeLog(level: "info" | "error", fields: LogFields): void {
  const line = JSON.stringify({ level, ...sanitizeLog(fields) });
  if (level === "error") console.error(line);
  else console.log(line);
}
