import { buildSearchTokens } from "../../../shared/src/patient-search-tokens.ts";
import { generateFakePatients } from "./fake-patients.ts";

const BATCH = 100;
const ACTOR = "system";

/** Local-only SQL to (re)load fake patients into D1. Never run against staging/production. */
export function buildLocalPatientSeedSql(count = 5000, seed = 1): string[] {
  const patients = generateFakePatients(count, seed);
  const statements: string[] = [
    "DELETE FROM patient_search WHERE patient_id LIKE 'seed%';",
    "DELETE FROM patients WHERE id LIKE 'seed%';",
    ...insertBatches(patients),
    ...tokenBatches(patients),
    counterUpsert(count),
  ];
  return statements;
}

function insertBatches(patients: ReturnType<typeof generateFakePatients>): string[] {
  const out: string[] = [];
  for (let i = 0; i < patients.length; i += BATCH) {
    const chunk = patients.slice(i, i + BATCH);
    const values = chunk
      .map(
        (p) =>
          `(${sqlStr(p.id)}, ${sqlStr(ACTOR)}, ${sqlStr(ACTOR)}, ${sqlStr(p.code)}, ${sqlStr(p.fullName)}, ${sqlStr(p.gender)}, ${p.ageYearsAtReg}, ${sqlStr(p.mobileE164)}, 'active')`,
      )
      .join(",\n");
    out.push(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status) VALUES\n${values};`,
    );
  }
  return out;
}

function tokenBatches(patients: ReturnType<typeof generateFakePatients>): string[] {
  type Row = { id: string; patientId: string; token: string; kind: string };
  const rows: Row[] = [];
  let n = 0;
  for (const p of patients) {
    for (const t of buildSearchTokens({
      fullName: p.fullName,
      code: p.code,
      mobile: p.mobileE164,
      mobileSecondary: null,
      legacyRef: null,
    })) {
      n += 1;
      rows.push({
        id: `seedtok${String(n).padStart(18, "0")}`,
        patientId: p.id,
        token: t.token,
        kind: t.kind,
      });
    }
  }
  const out: string[] = [];
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const values = chunk
      .map(
        (r) =>
          `(${sqlStr(r.id)}, ${sqlStr(ACTOR)}, ${sqlStr(ACTOR)}, ${sqlStr(r.patientId)}, ${sqlStr(r.token)}, ${sqlStr(r.kind)})`,
      )
      .join(",\n");
    out.push(
      `INSERT INTO patient_search (id, created_by, updated_by, patient_id, token, kind) VALUES\n${values};`,
    );
  }
  return out;
}

function counterUpsert(count: number): string {
  return (
    `INSERT INTO counters (id, name, period, value, created_by, updated_by) ` +
    `VALUES (${sqlStr("seedcounter00000000000001")}, 'patient_code', 'all', ${count}, ${sqlStr(ACTOR)}, ${sqlStr(ACTOR)}) ` +
    `ON CONFLICT(name, period) DO UPDATE SET ` +
    `value = MAX(counters.value, excluded.value), ` +
    `updated_by = ${sqlStr(ACTOR)}, ` +
    `version = counters.version + 1;`
  );
}

function sqlStr(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export const SEED_BATCH_SIZE = BATCH;
