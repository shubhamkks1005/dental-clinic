import { generateFakePatients } from "./fake-patients";

/**
 * 3.10.5: SQL for ~200 fake patients' clinical history (local D1 only).
 * Charts/visits/files metadata only — no real PHI, no binary blobs.
 */
export function buildFakeClinicalSeedSql(count = 200, seed = 2): string[] {
  const patients = generateFakePatients(count, seed);
  const statements: string[] = [];
  const batch: string[] = [];

  const flush = () => {
    if (batch.length) {
      statements.push(batch.join("\n"));
      batch.length = 0;
    }
  };

  batch.push("DELETE FROM tooth_events WHERE id LIKE 'seede%';");
  batch.push("DELETE FROM files WHERE id LIKE 'seedf%';");
  batch.push("DELETE FROM visits WHERE id LIKE 'seedv%';");
  batch.push("DELETE FROM patients WHERE id LIKE 'seedc%';");
  flush();

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i]!;
    const patientId = `seedc${String(i).padStart(5, "0")}`;
    const code = `P-${String(900000 + i).padStart(6, "0")}`;
    batch.push(
      `INSERT OR IGNORE INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
VALUES ('${patientId}', 'system', 'system', '${code}', '${esc(p.fullName)} (fake)', '${p.gender}', ${p.ageYearsAtReg}, '${p.mobileE164}', 'active');`,
    );

    const visitId = `seedv${String(i).padStart(5, "0")}`;
    const day = 10 + (i % 18);
    const date = `2026-01-${String(day).padStart(2, "0")}`;
    batch.push(
      `INSERT OR IGNORE INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status, chief_complaint, version)
VALUES ('${visitId}', 'system', 'system', '${patientId}', 'system', '${date}', 'final', 'Fake toothache ${i}', 1);`,
    );

    for (const tooth of [16, 26, 36, 46]) {
      const ev = `seede${String(i).padStart(5, "0")}${tooth}`;
      batch.push(
        `INSERT OR IGNORE INTO tooth_events (id, created_by, updated_by, patient_id, visit_id, tooth_fdi, surface, condition_code, noted_at, noted_by)
VALUES ('${ev}', 'system', 'system', '${patientId}', '${visitId}', ${tooth}, 'o', 'caries', '${date}T10:00:00.000Z', 'system');`,
      );
    }

    const fileId = `seedf${String(i).padStart(5, "0")}`;
    batch.push(
      `INSERT OR IGNORE INTO files (id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256, original_filename)
VALUES ('${fileId}', 'system', 'system', '${patientId}', 'f/seed-${fileId}', 'scan', 'image/jpeg', 1200, '${"c".repeat(64)}', 'fake-scan-${i}.jpg');`,
    );

    if (batch.length >= 80) flush();
  }

  flush();
  return statements;
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}
