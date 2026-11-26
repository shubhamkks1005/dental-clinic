import { z } from "zod";

// Several doctors (owner 2026-11-26). The list comes from staff records (role doctor, active);
// the colour is fixed by the doctor's position, and is always shown together with the name.
export type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  colourIndex: number;
};

/** Text and tint pairs; the first three are the final calendar design's doctor colours. */
export const DOCTOR_COLOURS = [
  { fg: "#054D61", bg: "#D0E6F0" },
  { fg: "#5E35B1", bg: "#EDE7F6" },
  { fg: "#C25E00", bg: "#FFF3E0" },
  { fg: "#2E7D32", bg: "#E8F5E9" },
  { fg: "#AD1457", bg: "#FCE4EC" },
  { fg: "#455A64", bg: "#ECEFF1" },
] as const;

export function doctorColour(colourIndex: number) {
  const n = DOCTOR_COLOURS.length;
  return DOCTOR_COLOURS[((colourIndex % n) + n) % n]!;
}

const TITLE = /^(dr\.?|doctor)\s+/i;

/** "Dr. Arvind Mehta" -> "Dr. Mehta"; "Priya" -> "Dr. Priya". */
export function doctorShortName(name: string): string {
  const words = name.trim().replace(TITLE, "").split(/\s+/).filter(Boolean);
  const last = words[words.length - 1];
  return last ? `Dr. ${last}` : "Doctor";
}

/** Body to add a leave day (Settings > Timings, owner Q4). */
export const doctorLeaveSchema = z.object({
  doctorId: z.string().trim().min(1, "Choose a doctor.").max(40),
  dateLocal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Choose a real date."),
  note: z
    .string()
    .trim()
    .max(100, "Keep the note under 100 letters.")
    .optional()
    .transform((v) => v || null),
});

export type DoctorLeaveInput = z.infer<typeof doctorLeaveSchema>;

export type DoctorLeave = {
  id: string;
  doctorId: string;
  doctorName: string;
  dateLocal: string;
  note: string | null;
  version: number;
};

/** Per day in the calendar reply: which doctors are away. */
export type DayLeave = { doctorId: string; doctorName: string };
