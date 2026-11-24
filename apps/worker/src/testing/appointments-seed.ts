import type { migratedSqlite } from "@clinic/db/testing";
import type { Bindings } from "../types";
import { addStaff, ORIGIN, sessionCookie } from "./app-env";
import app from "../index";

// Test-only: fake patients, appointments, one alert, one unpaid bill and one finished visit, so the
// day and week lists can be checked end to end. Fake data only.
type Sqlite = ReturnType<typeof migratedSqlite>;

export const WEEK_FIRST = "2026-12-07"; // a Monday
export const WEEK_DAYS = Array.from(
  { length: 7 },
  (_, i) => `2026-12-${String(7 + i).padStart(2, "0")}`,
);

export function seedStaff(sqlite: Sqlite) {
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  addStaff(sqlite, { id: "dev-1", email: "dev@example.test", role: "developer" });
}

function addPatient(sqlite: Sqlite, id: string, n: number) {
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', ?, ?, 'female', 30, ?, 'active')`,
    )
    .run(id, `P-00000${n}`, `Fake Patient ${n}`, `+91900000000${n}`);
}

export function addAppointment(
  sqlite: Sqlite,
  a: { id: string; patientId: string; dateLocal: string; startMin: number },
) {
  sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook
       ) VALUES (?, 'system', 'system', ?, '1', 'vt1', 'Consultation',
         ?, ?, ?, ?, 'scheduled', 'phone', 'normal', 0)`,
    )
    .run(
      a.id,
      a.patientId,
      `${a.dateLocal}T05:00:00.000Z`,
      a.dateLocal,
      a.startMin,
      a.startMin + 30,
    );
}

/** p1: alert + Rs 500 due, two appointments. p2: finished visit with no bill, one appointment. */
export function seedWeek(sqlite: Sqlite) {
  addPatient(sqlite, "p1", 1);
  addPatient(sqlite, "p2", 2);
  addAppointment(sqlite, {
    id: "a-mon-1",
    patientId: "p1",
    dateLocal: WEEK_DAYS[0]!,
    startMin: 600,
  });
  addAppointment(sqlite, {
    id: "a-mon-2",
    patientId: "p2",
    dateLocal: WEEK_DAYS[0]!,
    startMin: 660,
  });
  addAppointment(sqlite, {
    id: "a-wed-1",
    patientId: "p1",
    dateLocal: WEEK_DAYS[2]!,
    startMin: 600,
  });
  addAppointment(sqlite, {
    id: "a-sun-1",
    patientId: "p2",
    dateLocal: WEEK_DAYS[6]!,
    startMin: 600,
  });
  addAppointment(sqlite, {
    id: "a-outside",
    patientId: "p1",
    dateLocal: "2026-12-14",
    startMin: 600,
  });
  sqlite
    .prepare(
      `INSERT INTO alerts (id, created_by, updated_by, patient_id, code, label, restricted, active)
       VALUES ('al-1', 'system', 'system', 'p1', 'penicillin', 'Penicillin allergy', 1, 1)`,
    )
    .run();
  sqlite
    .prepare(
      `INSERT INTO bills (id, created_by, updated_by, patient_id, bill_on, status, total_paise)
       VALUES ('b1', 'system', 'system', 'p1', '2026-12-01', 'issued', 50000)`,
    )
    .run();
  sqlite
    .prepare(
      `INSERT INTO visits (id, created_by, updated_by, patient_id, appointment_id, doctor_id, visit_date_local, status)
       VALUES ('v1', 'system', 'system', 'p2', 'a-mon-2', 'doc-a', ?, 'final')`,
    )
    .run(WEEK_DAYS[0]);
}

export type SeenAppointment = {
  id: string;
  patientId: string;
  hasDue: boolean;
  duePaise: number | null;
  readyToBill: { billId: string | null } | null;
  alertFlags: { hasAlert: boolean; hasRestricted: boolean };
};
export type SeenDay = {
  dateLocal: string;
  serverNow: string;
  window: unknown;
  appointments: SeenAppointment[];
};

export async function getAs(env: Bindings, email: string, path: string) {
  const cookie = await sessionCookie(env, email);
  const res = await app.request(`${ORIGIN}${path}`, { headers: { cookie } }, env);
  const timing = res.headers.get("server-timing") ?? "";
  return {
    status: res.status,
    // One reply type for both endpoints: a day reply, or { days } for the range.
    body: (await res.json()) as {
      data: SeenDay & { days: SeenDay[] };
      error?: { message: string };
    },
    roundTrips: Number(/queries;desc="(\d+)"/.exec(timing)?.[1]),
    statements: Number(/statements;desc="(\d+)"/.exec(timing)?.[1]),
  };
}
