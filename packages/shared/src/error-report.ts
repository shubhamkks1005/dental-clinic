import { z } from "zod";
import type { Parsed } from "./staff";

// 9.2.5: what the browser may send when something crashes. No free text, no patient data:
// an error name, a short message, the screen path and an optional Error ID.
export const ERROR_REPORT_MAX_BYTES = 2048;

const errorReportSchema = z.object({
  kind: z
    .string()
    .trim()
    .regex(/^[A-Za-z][A-Za-z0-9_.-]{0,59}$/, "Bad error name."),
  message: z.string().trim().min(1).max(200),
  path: z.string().trim().max(200).optional(),
  requestId: z
    .string()
    .regex(/^[0-9A-Za-z-]{6,64}$/)
    .optional(),
});

export type ErrorReportInput = z.infer<typeof errorReportSchema>;

export function parseErrorReport(raw: unknown): Parsed<ErrorReportInput> {
  const parsed = errorReportSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "That error report was not valid." };
  return { ok: true, value: parsed.data };
}

/** One row of the doctor's error list. */
export type ErrorLogEntry = {
  id: string;
  createdAt: string;
  source: string;
  kind: string;
  message: string;
  path: string | null;
  requestId: string | null;
  appVersion: string | null;
  role: string | null;
};
