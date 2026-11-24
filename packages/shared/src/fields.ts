import { z } from "zod";
import { normaliseMobile } from "./mobile";
import { parseDisplayDate } from "./time";

// Zod building blocks for forms (1.4.4). Same rules in the browser and the Worker; messages are
// plain English sentences for staff.
export const personNameField = z
  .string()
  .trim()
  .min(1, "Enter the name.")
  .max(80, "The name is too long.")
  .transform((v) => v.replace(/\s+/g, " "));

export const mobileField = z.string().transform((raw, ctx) => {
  const mobile = normaliseMobile(raw);
  if (mobile) return mobile;
  ctx.addIssue({
    code: "custom",
    message: "Enter a 10-digit mobile number that starts with 6, 7, 8 or 9.",
  });
  return z.NEVER;
});

// Typed as DD/MM/YYYY, stored as YYYY-MM-DD.
export const displayDateField = z.string().transform((raw, ctx) => {
  const date = parseDisplayDate(raw);
  if (date) return date;
  ctx.addIssue({
    code: "custom",
    message: "Enter the date as DD/MM/YYYY, for example 05/08/1990.",
  });
  return z.NEVER;
});

// A request body that only carries the version the screen last saw (queue moves, break end, ...).
export const versionBodySchema = z.object({
  version: z.number({ error: "Reload and try again." }).int().min(1),
});
