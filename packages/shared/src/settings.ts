import { z } from "zod";
import type { Parsed } from "./staff";
import { holidaysSchema, timingsSchema } from "./timings";

// 1.5.1: every setting the app knows, with its rule. A value that breaks the rule is never
// saved. New settings (timings 1.5.3, lists 1.5.4, clinic details 1.5.2) add a line here and a
// seed migration with the default.
export const SETTING_SCHEMAS = {
  "patient_code.prefix": z
    .string({ error: "Enter the prefix as text." })
    .trim()
    .regex(/^[A-Z0-9-]{1,5}$/, "Use 1 to 5 capital letters, digits or dashes, for example P-."),
  "patient_code.digits": z
    .number({ error: "Enter a number." })
    .int("Use a whole number.")
    .min(4, "Use at least 4 digits.")
    .max(8, "Use at most 8 digits."),
  "clinic.name": z
    .string({ error: "Enter the clinic name." })
    .trim()
    .min(1, "Enter the clinic name.")
    .max(80, "The clinic name is too long."),
  // Storage key of the uploaded logo (1.5.2); null = the placeholder tooth mark.
  "clinic.logo": z.string({ error: "The logo value is not valid." }).max(300).nullable(),
  // 1.5.3: weekly hours, slot length, chairs; and the list of holidays.
  "clinic.timings": timingsSchema,
  "clinic.holidays": holidaysSchema,
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;

export const SETTING_KEYS = Object.keys(SETTING_SCHEMAS) as SettingKey[];

export const isSettingKey = (key: string): key is SettingKey => Object.hasOwn(SETTING_SCHEMAS, key);

// Returns the cleaned value (for example trimmed text) or the first plain-English problem.
export function parseSettingValue(key: SettingKey, value: unknown): Parsed<unknown> {
  const result = SETTING_SCHEMAS[key].safeParse(value);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, message: result.error.issues[0]?.message ?? "This value is not allowed." };
}
