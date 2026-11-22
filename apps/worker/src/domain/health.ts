import { pingDb, type Db } from "@clinic/db";

export type HealthData = { status: "ok"; version: string };

export type VersionMeta = { id: string; tag?: string };

/** Prefer a deploy tag; otherwise a short version id; local/tests without the binding → "dev". */
export function buildVersion(meta?: VersionMeta | null): string {
  const tag = meta?.tag?.trim();
  if (tag) return tag;
  if (meta?.id) return meta.id.slice(0, 12);
  return "dev";
}

export async function checkHealth(
  db: Db,
  version: string,
): Promise<{ ok: true; data: HealthData } | { ok: false; message: string }> {
  try {
    await pingDb(db);
    return { ok: true, data: { status: "ok", version } };
  } catch {
    return {
      ok: false,
      message: "The clinic database did not answer. Try again in a minute.",
    };
  }
}
