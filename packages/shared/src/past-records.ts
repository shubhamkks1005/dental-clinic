import { z } from "zod";

const dateOn = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date as YYYY-MM-DD.");

export const createPastRecordBody = z
  .object({
    recordedOn: dateOn,
    body: z.string().trim().min(1).max(4000),
    fileId: z.string().min(1).optional().nullable(),
  })
  .strict();

export type CreatePastRecordBody = z.infer<typeof createPastRecordBody>;

export function parseCreatePastRecord(body: unknown) {
  const parsed = createPastRecordBody.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the past record and try again.",
    };
  }
  return { ok: true as const, value: parsed.data };
}
