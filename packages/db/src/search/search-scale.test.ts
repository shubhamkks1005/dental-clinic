import { buildSearchTokens, newUlid, searchWords, tokenRangeEnd } from "@clinic/shared";
import { afterAll, describe, expect, it } from "vitest";
import { generateFakePatients } from "../seed/fake-patients";
import { fullScans, queryPlan } from "../testing";
import { testDb } from "../testing/test-db";

// 2.1.6 Done when: on 5,000 patients, EXPLAIN shows the token index and a search reads < 100 rows.
const { sqlite } = testDb();
afterAll(() => sqlite.close());

const COUNT = 5000;

describe("patient search scale (2.1.6)", () => {
  it("indexes 5,000 fake patients and finds by name / last-4 with an indexed plan", () => {
    const insertPatient = sqlite.prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', ?, ?, ?, ?, ?, 'active')`,
    );
    const insertToken = sqlite.prepare(
      `INSERT INTO patient_search (id, created_by, updated_by, patient_id, token, kind)
       VALUES (?, 'system', 'system', ?, ?, ?)`,
    );

    const people = generateFakePatients(COUNT, 1);
    sqlite.exec("BEGIN");
    for (const p of people) {
      insertPatient.run(p.id, p.code, p.fullName, p.gender, p.ageYearsAtReg, p.mobileE164);
      for (const t of buildSearchTokens({
        fullName: p.fullName,
        code: p.code,
        mobile: p.mobileE164,
        mobileSecondary: null,
        legacyRef: null,
      })) {
        insertToken.run(newUlid(), p.id, t.token, t.kind);
      }
    }
    sqlite.exec("COMMIT");

    const nameWord = "sharma";
    const namePlan = queryPlan(
      sqlite,
      "SELECT DISTINCT patient_id FROM patient_search WHERE token >= ? AND token < ? LIMIT 100",
      [nameWord, tokenRangeEnd(nameWord)],
    );
    expect(namePlan.some((l) => /patient_search_token_idx/i.test(l))).toBe(true);
    expect(fullScans(namePlan)).toEqual([]);

    const nameHits = sqlite
      .prepare(
        "SELECT DISTINCT patient_id AS id FROM patient_search WHERE token >= ? AND token < ? LIMIT 100",
      )
      .all(nameWord, tokenRangeEnd(nameWord)) as { id: string }[];
    expect(nameHits.length).toBeGreaterThan(0);
    expect(nameHits.length).toBeLessThanOrEqual(100);

    // Last 4 digits via reversed mobile prefix (3210 → look up on mobile_rev starting with 0123…).
    const sample = people[12]!;
    const last4 = sample.mobile.slice(-4);
    const revPrefix = [...last4].reverse().join("");
    const words = searchWords(last4);
    expect(words[0]).toBe(last4);
    const revHits = sqlite
      .prepare(
        `SELECT DISTINCT patient_id AS id FROM patient_search
         WHERE kind = 'mobile_rev' AND token >= ? AND token < ? LIMIT 100`,
      )
      .all(revPrefix, tokenRangeEnd(revPrefix)) as { id: string }[];
    // Searching last-4 as forward digits uses mobile token suffix — use reverse prefix as designed.
    expect(revHits.some((h) => h.id === sample.id)).toBe(true);
    expect(revHits.length).toBeLessThanOrEqual(100);

    const last4Plan = queryPlan(
      sqlite,
      `SELECT DISTINCT patient_id FROM patient_search
       WHERE kind = 'mobile_rev' AND token >= ? AND token < ? LIMIT 100`,
      [revPrefix, tokenRangeEnd(revPrefix)],
    );
    expect(last4Plan.some((l) => /patient_search_token_idx/i.test(l))).toBe(true);
  });
});
