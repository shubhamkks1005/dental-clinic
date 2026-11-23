// Shared bits for the staging seed.
export type SeedReport = {
  patients: number;
  requests: number;
  appointments: number;
  visitsFinal: number;
  visitsOpen: number;
  prescriptions: number;
  bills: number;
  payments: number;
  refunds: number;
  closedDay: string | null;
  skipped: string[];
};

export type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function must<T extends Obj>(r: T, what: string): T {
  if (r.ok === false) throw new Error(`Seed step failed (${what}): ${String(r.message)}`);
  return r;
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** A clock time on an IST day, as a Date. */
export function at(day: string, minutes: number): Date {
  return new Date(new Date(`${day}T00:00:00+05:30`).getTime() + minutes * 60_000);
}

export type Flow = {
  day: string;
  slot: number;
  patientId: string;
  appt: Obj;
  k: number;
  off: number;
};
