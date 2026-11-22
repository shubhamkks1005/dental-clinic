import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

type Issue = { path: PropertyKey[]; code: string; message: string };

// Our own zod adapter for react-hook-form (owner decision: no @hookform/resolvers package).
// Valid input gives the parsed (normalised) values; otherwise the first message per field.
export function zodResolver<Input extends FieldValues, Output extends FieldValues>(
  schema: z.ZodType<Output, Input>,
): Resolver<Input, unknown, Output> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };
    return { values: {}, errors: toFieldErrors(result.error.issues) as FieldErrors<Input> };
  };
}

// react-hook-form wants nested objects: path ["address", "city"] -> { address: { city: {...} } }.
export function toFieldErrors(issues: readonly Issue[]): Record<string, unknown> {
  const errors: Record<string, unknown> = {};
  for (const issue of issues) {
    const path = issue.path.map(String);
    const last = path.pop();
    if (last === undefined) continue;
    let node = errors;
    for (const key of path) {
      node[key] ??= {};
      node = node[key] as Record<string, unknown>;
    }
    node[last] ??= { type: issue.code, message: issue.message };
  }
  return errors;
}
