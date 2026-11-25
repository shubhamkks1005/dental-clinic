import { z } from "zod";
import type { Parsed } from "./staff";

export const BILL_NOTE_MAX = 200;

// The note stays with the bill and the desk can read it: no health details in it.
const billNoteSchema = z.object({
  version: z.number({ error: "Reload the bill and try again." }).int().positive(),
  note: z
    .string({ error: "Enter the note." })
    .trim()
    .max(BILL_NOTE_MAX, `Keep the note under ${BILL_NOTE_MAX} characters.`),
});

export type BillNoteInput = z.infer<typeof billNoteSchema>;

export function parseBillNote(body: unknown): Parsed<BillNoteInput> {
  const r = billNoteSchema.safeParse(body);
  if (!r.success) return { ok: false, message: r.error.issues[0]?.message ?? "Check the note." };
  return { ok: true, value: r.data };
}
