import type { DatabaseSync } from "node:sqlite";

/** A fake doctor user for repo tests (several doctors, 0066). Names are invented. */
export function addFakeDoctor(
  sqlite: DatabaseSync,
  id = "doc-a",
  name = "Dr. Fake Asha",
  createdAt = "2026-01-01T00:00:00.000Z",
): string {
  sqlite
    .prepare(
      `INSERT INTO users (id, created_by, updated_by, created_at, email, name, role, status)
       VALUES (?, 'system', 'system', ?, ?, ?, 'doctor', 'active')`,
    )
    .run(id, createdAt, `${id}@example.test`, name);
  return id;
}

/** A leave day for a fake doctor. */
export function addFakeLeave(sqlite: DatabaseSync, doctorId: string, dateLocal: string): void {
  sqlite
    .prepare(
      `INSERT INTO doctor_leaves (id, created_by, updated_by, doctor_id, date_local)
       VALUES (?, 'system', 'system', ?, ?)`,
    )
    .run(`leave-${doctorId}-${dateLocal}`, doctorId, dateLocal);
}
