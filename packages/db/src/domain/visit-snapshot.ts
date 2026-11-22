import { sha256Hex } from "../crypto-sha256";

/** Immutable snapshot payload written at finalise (3.2.6). */
export type VisitSnapshot = {
  visit: Record<string, unknown>;
  diagnoses: unknown[];
  procedures: unknown[];
  toothEvents: unknown[];
  finalisedAt: string;
  finalisedBy: string;
};

export async function snapshotJsonAndHash(
  snapshot: VisitSnapshot,
): Promise<{ json: string; hash: string }> {
  const json = JSON.stringify(snapshot);
  return { json, hash: await sha256Hex(json) };
}
