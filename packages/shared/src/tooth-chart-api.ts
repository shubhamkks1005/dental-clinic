import { z } from "zod";
import { isFdiTooth, isToothSurface } from "./teeth";

/** POST body: append a tooth_event on today's draft visit (3.4.5). */
export const addToothEventBody = z
  .object({
    visitId: z.string().min(1, "Open a draft visit first."),
    toothFdi: z.number({ error: "Pick a tooth." }).int(),
    surface: z.string().min(1, "Pick a surface."),
    conditionCode: z
      .string()
      .trim()
      .min(1, "Pick a condition.")
      .max(40, "Condition code is too long."),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (!isFdiTooth(v.toothFdi)) {
      ctx.addIssue({
        code: "custom",
        message: "Use an FDI tooth number (11–48 or 51–85).",
        path: ["toothFdi"],
      });
    }
    if (!isToothSurface(v.surface)) {
      ctx.addIssue({
        code: "custom",
        message: "Use a surface: m, d, o, b, l, or whole.",
        path: ["surface"],
      });
    }
  });

export type AddToothEventBody = z.infer<typeof addToothEventBody>;

export function parseAddToothEvent(body: unknown) {
  const parsed = addToothEventBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the chart." };
  }
  return { ok: true as const, value: parsed.data };
}
