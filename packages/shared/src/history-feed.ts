import { z } from "zod";

/** Stage-1 history entry kinds (3.5.12 / 3.5.13). Later stages add Rx / bills. */
export const HISTORY_ENTRY_TYPES = [
  "appointment",
  "visit",
  "treatment",
  "file",
  "medical_change",
  "consent",
  "amendment",
] as const;
export type HistoryEntryType = (typeof HISTORY_ENTRY_TYPES)[number];

export const HISTORY_FEED_PAGE_SIZE = 30;

const cursorSchema = z.object({
  at: z.string().min(1),
  id: z.string().min(1),
});

export type HistoryCursor = z.infer<typeof cursorSchema>;

/** Opaque cursor: hex of UTF-8 JSON (no Buffer/btoa — shared has no DOM/Node types). */
export function encodeHistoryCursor(cursor: HistoryCursor): string {
  const json = JSON.stringify(cursor);
  let hex = "";
  for (let i = 0; i < json.length; i++) {
    hex += json.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex;
}

export function decodeHistoryCursor(raw: string | null | undefined): HistoryCursor | null {
  if (!raw?.trim() || raw.length % 2 !== 0) return null;
  try {
    let json = "";
    for (let i = 0; i < raw.length; i += 2) {
      json += String.fromCharCode(Number.parseInt(raw.slice(i, i + 2), 16));
    }
    const parsed = cursorSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const historyFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export function parseHistoryFeedQuery(input: unknown) {
  const parsed = historyFeedQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "Check the history feed request and try again." };
  }
  return { ok: true as const, value: parsed.data };
}
