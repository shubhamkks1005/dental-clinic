import { z } from "zod";
import { normaliseMobile } from "./mobile";

// Body for POST /api/staff/patients/duplicate-check (2.1.7). Soft warning only.
export const duplicateCheckBody = z.object({
  fullName: z.string().trim().min(1, "Enter the patient's full name."),
  mobile: z.string().trim().optional().nullable(),
  mobileSecondary: z.string().trim().optional().nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a real date of birth.")
    .optional()
    .nullable(),
  ageYearsAtReg: z.number().int().min(0).max(120).optional().nullable(),
});

export type DuplicateCheckBody = z.infer<typeof duplicateCheckBody>;

export function parseDuplicateCheck(body: unknown):
  | { ok: true; value: DuplicateCheckBody & { mobile: string | null; mobileSecondary: string | null } }
  | { ok: false; message: string } {
  const parsed = duplicateCheckBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const mobileRaw = parsed.data.mobile?.trim() || null;
  const secondaryRaw = parsed.data.mobileSecondary?.trim() || null;
  const mobile = mobileRaw ? normaliseMobile(mobileRaw) : null;
  const mobileSecondary = secondaryRaw ? normaliseMobile(secondaryRaw) : null;
  if (mobileRaw && !mobile) {
    return { ok: false, message: "Enter a valid mobile number, or leave it blank." };
  }
  if (secondaryRaw && !mobileSecondary) {
    return { ok: false, message: "Enter a valid other mobile, or leave it blank." };
  }
  return {
    ok: true,
    value: {
      ...parsed.data,
      mobile,
      mobileSecondary,
      dateOfBirth: parsed.data.dateOfBirth ?? null,
      ageYearsAtReg: parsed.data.ageYearsAtReg ?? null,
    },
  };
}
