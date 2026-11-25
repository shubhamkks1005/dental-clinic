import type { ToothSurface } from "@clinic/shared";
import type { PageDiagnosis, PageProcedure } from "./page-api";
import { parseSurfaces } from "./lines-model";

// Client-side lines of the diagnosis and procedure section. A line shows at once (optimistic) and
// carries the server id and version when the reply has come. `key` never changes, `id` may be null.

export type DiagLine = {
  key: string;
  id: string | null;
  version: number;
  label: string;
  toothFdi: number | null;
  fromList: boolean;
};

export type ProcLine = {
  key: string;
  id: string | null;
  version: number;
  label: string;
  toothFdi: number | null;
  surfaces: ToothSurface[];
  note: string;
  /** The list has no fee for it: the only fee word on this screen (owner decision Q12). */
  noFee: boolean;
  moreSittings: boolean;
};

export const diagFromPage = (d: PageDiagnosis): DiagLine => ({
  key: d.id,
  id: d.id,
  version: d.version,
  label: d.label,
  toothFdi: d.toothFdi,
  fromList: d.listItemId !== null,
});

export const procFromPage = (p: PageProcedure): ProcLine => ({
  key: p.id,
  id: p.id,
  version: p.version,
  label: p.label,
  toothFdi: p.toothFdi,
  surfaces: parseSurfaces(p.surfacesJson),
  note: p.note ?? "",
  noFee: p.defaultPaise === null || p.defaultPaise <= 0,
  moreSittings: p.moreSittings,
});

let counter = 0;
/** A key for a line the server has not answered for yet. */
export const tempKey = () => `tmp-${Date.now().toString(36)}-${++counter}`;

/** Put an item back where it was (clamped), used by Undo of a remove. */
export function insertAt<T>(list: T[], item: T, index: number): T[] {
  const at = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, at), item, ...list.slice(at)];
}

/**
 * Runs the jobs of one key one after the other, so two quick edits of one line never send the same
 * version twice. A failed job does not stop the next one.
 */
export function createKeyedQueue() {
  const tails = new Map<string, Promise<unknown>>();
  return function enqueue<T>(key: string, job: () => Promise<T>): Promise<T> {
    const run = (tails.get(key) ?? Promise.resolve()).then(job, job);
    const tail = run.catch(() => undefined);
    tails.set(key, tail);
    void tail.then(() => {
      if (tails.get(key) === tail) tails.delete(key);
    });
    return run;
  };
}
