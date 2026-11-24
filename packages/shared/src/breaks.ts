import { z } from "zod";

/** Doctor break presets (labels as in the final Today design). */
export const BREAK_PRESETS = [
  { minutes: 5, label: "Quick stretch" },
  { minutes: 10, label: "Short breather" },
  { minutes: 15, label: "Coffee & reset" },
  { minutes: 45, label: "Lunch break" },
] as const;

export const BREAK_STEP_MINUTES = 5;
export const BREAK_MIN_MINUTES = 5;
export const BREAK_MAX_MINUTES = 120;

const minutesField = z
  .number({ error: "Choose how long the break is." })
  .int("Use whole minutes.")
  .min(BREAK_MIN_MINUTES, `A break must be at least ${BREAK_MIN_MINUTES} minutes.`)
  .max(BREAK_MAX_MINUTES, `A break can be at most ${BREAK_MAX_MINUTES} minutes.`)
  .refine((n) => n % BREAK_STEP_MINUTES === 0, `Use steps of ${BREAK_STEP_MINUTES} minutes.`);

export const startBreakSchema = z.object({
  minutes: minutesField,
  label: z.string().trim().min(1).max(40).optional(),
});
export type StartBreakInput = z.infer<typeof startBreakSchema>;

export const adjustBreakSchema = z.object({
  deltaMinutes: z
    .number({ error: "Choose how many minutes to change." })
    .int("Use whole minutes.")
    .refine(
      (n) => n !== 0 && n % BREAK_STEP_MINUTES === 0,
      `Use steps of ${BREAK_STEP_MINUTES} minutes.`,
    ),
  version: z.number().int().min(1),
});
export type AdjustBreakInput = z.infer<typeof adjustBreakSchema>;

export const endBreakSchema = z.object({ version: z.number().int().min(1) });

/** The break that is on now, as the day list and the break routes return it. */
export type CurrentBreak = {
  id: string;
  startedAt: string;
  minutes: number;
  label: string;
  version: number;
};

export function breakEndsAt(b: Pick<CurrentBreak, "startedAt" | "minutes">): Date {
  return new Date(new Date(b.startedAt).getTime() + b.minutes * 60_000);
}
