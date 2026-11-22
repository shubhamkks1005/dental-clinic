import { generateFakePatients } from "./fake-patients.ts";

const BATCH = 100;
const ACTOR = "system";

/** Local-only SQL to (re)load fake patients into D1. Never run against staging/production. */
export function buildLocalPatientSeedSql(count = 5000, seed = 1): string[] {
  const patients = generateFakePatients(count, seed);
  const statements: string[] = [
    "DELETE FROM patients WHERE id LIKE 'seed%';",
    ...insertBatches(patients),
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

function counterUpsert(count: number): string {
  // Keep a higher live counter if non-seed patients already advanced it.
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
