import { daysBetweenOn } from "./dues";
import type { MedicalAnswer } from "./medical-history";

// The always-visible strip on the doctor's visit page: "No diabetes", "No blood thinner" and
// "Follow-up: 4 days late". Both rules are pure functions so the server and the screen agree.

/** Medical history checklist codes the strip looks at (seeded in migration 0025). */
export const STRIP_CODES = {
  diabetes: ["diabetes"],
  bloodThinner: ["med_blood_thinner"],
} as const;

/**
 * What the checklist says about one condition: "yes" if any of the codes was answered yes, "no"
 * if one was answered no (and none yes), otherwise "unknown" (never asked, or answered unknown).
 * The screen must never print "No diabetes" for "unknown".
 */
export function historyAnswer(
  items: readonly { code: string; answer: MedicalAnswer }[] | null | undefined,
  codes: readonly string[],
): MedicalAnswer {
  const hits = (items ?? []).filter((i) => codes.includes(i.code));
  if (hits.some((i) => i.answer === "yes")) return "yes";
  if (hits.some((i) => i.answer === "no")) return "no";
  return "unknown";
}

export type FollowUpStatus = {
  /** YYYY-MM-DD the doctor asked the patient to come back. */
  dueOn: string;
  /** Days past the due date (0 on the day, negative before it). */
  daysLate: number;
  /** Last day of the longest medicine course, null when no course has a day count. */
  medsFinishedOn: string | null;
  state: "upcoming" | "due_today" | "late";
};

const addDaysOn = (on: string, days: number): string => {
  const [y, m, d] = on.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** "5", "5 days", "7 days after food" give 5, 5, 7. "SOS" or "" give null. */
export function courseDays(text: string | null | undefined): number | null {
  const n = Number(/\d+/.exec(text ?? "")?.[0]);
  return Number.isFinite(n) && n > 0 && n <= 365 ? n : null;
}

/**
 * Follow-up state from the latest issued prescription. `issuedOn` is the IST date it was issued;
 * a course ends `days` after that day. No follow-up date on the prescription: null.
 */
export function followUpStatus(input: {
  followUpOn: string | null | undefined;
  issuedOn: string | null | undefined;
  medicineDays: readonly (string | null | undefined)[];
  today: string;
}): FollowUpStatus | null {
  if (!input.followUpOn) return null;
  const longest = Math.max(0, ...input.medicineDays.map((d) => courseDays(d) ?? 0));
  const medsFinishedOn = input.issuedOn && longest > 0 ? addDaysOn(input.issuedOn, longest) : null;
  const daysLate = daysBetweenOn(input.followUpOn, input.today);
  return {
    dueOn: input.followUpOn,
    daysLate,
    medsFinishedOn,
    state: daysLate > 0 ? "late" : daysLate === 0 ? "due_today" : "upcoming",
  };
}
