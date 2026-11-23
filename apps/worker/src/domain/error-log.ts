import type { Repos } from "@clinic/db";
import { parseErrorReport } from "@clinic/shared";

// 9.2.5: browser error reports. Role comes from the session, never from the body.
export async function reportBrowserError(repos: Repos, body: unknown, appVersion: string) {
  const parsed = parseErrorReport(body);
  if (!parsed.ok) return { ok: false as const, status: 400 as const, message: parsed.message };
  const outcome = await repos.errorLog.report({
    source: "browser",
    kind: parsed.value.kind,
    message: parsed.value.message,
    path: parsed.value.path ?? null,
    requestId: parsed.value.requestId ?? null,
    appVersion,
  });
  if (outcome === "limited") {
    return {
      ok: false as const,
      status: 429 as const,
      message: "Too many error reports. Try later.",
    };
  }
  return { ok: true as const };
}

export async function listErrors(repos: Repos) {
  return { ok: true as const, errors: await repos.errorLog.list() };
}
