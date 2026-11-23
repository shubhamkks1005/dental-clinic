import { z } from "zod";
import { addIstDays, istLocalToUtc } from "./time";

/** History entry kinds (3.5.12+; Stage 2 adds prescription in 4.2.8). */
export const HISTORY_ENTRY_TYPES = [
  "appointment",
  "visit",
  "treatment",
  "prescription",
  "certificate",
  "bill",
  "payment",
  "refund",
  "file",
  "medical_change",
  "consent",
  "amendment",
  "past_record",
] as const;
export type HistoryEntryType = (typeof HISTORY_ENTRY_TYPES)[number];

export const HISTORY_FEED_PAGE_SIZE = 30;

/** 6.7.1 filter chips on the History tab (S04/S17). */
export const HISTORY_FILTER_CHIPS = [
  "all",
  "visits",
  "treatments",
  "prescriptions",
  "bills",
  "files",
  "appointments",
] as const;
export type HistoryFilterChip = (typeof HISTORY_FILTER_CHIPS)[number];

const CHIP_TYPES: Record<HistoryFilterChip, readonly HistoryEntryType[] | null> = {
  all: null,
  visits: ["visit"],
  treatments: ["treatment"],
  prescriptions: ["prescription"],
  bills: ["bill", "payment", "refund"],
  files: ["file"],
  appointments: ["appointment"],
};

/** Types returned for a chip; null means every type. */
export function historyTypesForChip(chip: HistoryFilterChip): readonly HistoryEntryType[] | null {
  return CHIP_TYPES[chip];
}

/** Entry types that can match a tooth filter (6.7.1). */
export const HISTORY_TOOTH_TYPES: readonly HistoryEntryType[] = ["visit", "treatment", "file"];

/** Entry types that can match procedure/diagnosis text search (6.7.1). */
export const HISTORY_TEXT_TYPES: readonly HistoryEntryType[] = ["visit", "treatment"];

const dateOn = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date as YYYY-MM-DD.");

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

function isFdiTooth(n: number): boolean {
  return (n >= 11 && n <= 48) || (n >= 51 && n <= 85);
}

export const historyFeedQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    chip: z.enum(HISTORY_FILTER_CHIPS).optional(),
    from: dateOn.optional(),
    to: dateOn.optional(),
    tooth: z.coerce.number().int().optional(),
    q: z.string().trim().max(80).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.from && v.to && v.from > v.to) {
      ctx.addIssue({
        code: "custom",
        message: "From date must be on or before to date.",
        path: ["from"],
      });
    }
    if (v.tooth != null && !isFdiTooth(v.tooth)) {
      ctx.addIssue({
        code: "custom",
        message: "Tooth must be an FDI number (11–48 or 51–85).",
        path: ["tooth"],
      });
    }
  });

export type HistoryFeedQuery = z.infer<typeof historyFeedQuerySchema>;

/** Resolved filters passed into the feed repo (6.7.1). */
export type HistoryFeedFilters = {
  types: readonly HistoryEntryType[] | null;
  /** Inclusive UTC lower bound from IST from date, or null. */
  fromAt: string | null;
  /** Exclusive UTC upper bound from IST to date + 1 day, or null. */
  toAtExclusive: string | null;
  tooth: number | null;
  /** Lowercased trimmed search; empty → null. */
  q: string | null;
};

export function resolveHistoryFeedFilters(query: HistoryFeedQuery): HistoryFeedFilters {
  const chip = query.chip ?? "all";
  let types = historyTypesForChip(chip);
  const tooth = query.tooth ?? null;
  const qRaw = query.q?.trim() ?? "";
  const q = qRaw.length > 0 ? qRaw.toLowerCase() : null;

  if (tooth != null) {
    const allowed = new Set(HISTORY_TOOTH_TYPES);
    types = types ? types.filter((t) => allowed.has(t)) : HISTORY_TOOTH_TYPES;
  }
  if (q) {
    const allowed = new Set(HISTORY_TEXT_TYPES);
    types = types ? types.filter((t) => allowed.has(t)) : HISTORY_TEXT_TYPES;
  }

  const fromAt = query.from ? istLocalToUtc(query.from, 0).toISOString() : null;
  const toAtExclusive = query.to ? istLocalToUtc(addIstDays(query.to, 1), 0).toISOString() : null;

  return { types, fromAt, toAtExclusive, tooth, q };
}

export function parseHistoryFeedQuery(input: unknown) {
  const parsed = historyFeedQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "Check the history feed request and try again." };
  }
  return { ok: true as const, value: parsed.data };
}
