// S2.2.3: queries on the busy screens that still read a whole table. Each one is named here so the
// plan guard (query-plan.test.ts) passes and the list stays visible. Not allowed: a new scan that
// is missing from this list. S5.1 adds the indexes and then deletes the entries (a test fails
// while an entry is left behind). "scan" = start of the plan line, "sqlHas" = a snippet of the
// statement with white space collapsed.
export type KnownScan = { name: string; scan: string; sqlHas: string };

const S5 = "known scan, S5.1 me index aayega";

export const KNOWN_SCANS: KnownScan[] = [
  {
    name: `${S5}: patients list and count (status, deleted_at, created_at; S5.1.1)`,
    scan: "SCAN patients",
    sqlHas: 'from "patients" where ("patients"."deleted_at" is null',
  },
  {
    name: `${S5}: draft visits list (status = draft; S5.1.2)`,
    scan: "SCAN visits",
    sqlHas: 'from "visits" inner join "patients"',
  },
  {
    name: `${S5}: draft prescriptions list (status = draft; S5.1.2)`,
    scan: "SCAN prescriptions",
    sqlHas: 'from "prescriptions" inner join "patients"',
  },
  {
    name: `${S5}: month stats by visits.visit_date_local (procedures join; S5.1.4)`,
    scan: "SCAN visit_procedures",
    sqlHas: '"visits"."visit_date_local" >=',
  },
  {
    name: `${S5}: month stats, refunds.approved_at (S5.1.4)`,
    scan: "SCAN refunds",
    sqlHas: '"refunds"."approved_at" >=',
  },
  {
    name: `${S5}: month stats, bills.bill_on (S5.1.3)`,
    scan: "SCAN bills",
    sqlHas: '"bills"."bill_on" >=',
  },
  {
    name: `${S5}: dashboard KPI total outstanding, all issued bills (S5.1.3)`,
    scan: "SCAN bills",
    sqlHas: 'from "bills" where ("bills"."status" = ? and "bills"."deleted_at" is null)',
  },
  {
    name: `${S5}: dashboard KPI total outstanding, allocations per bill (S5.1.3)`,
    scan: "SCAN payment_allocations",
    sqlHas: 'where "bill_id" = "id"',
  },
  {
    name: `${S5}: dashboard KPI refunded-and-not-applied, refunds side (S5.1.3)`,
    scan: "SCAN refunds USING INDEX",
    sqlHas: "r.refunded - (p.amount_paise",
  },
  {
    name: `${S5}: dashboard KPI refunded-and-not-applied, allocations side (S5.1.3)`,
    scan: "SCAN payment_allocations USING INDEX",
    sqlHas: "r.refunded - (p.amount_paise",
  },
  {
    name: `${S5}: dashboard KPI refunded-and-not-applied, refunds subquery (S5.1.3)`,
    scan: "SCAN r",
    sqlHas: "r.refunded - (p.amount_paise",
  },
  {
    name: `${S5}: dues list, refunds (S5.1.3)`,
    scan: "SCAN refunds USING INDEX",
    sqlHas: "WITH refunded AS",
  },
  {
    name: `${S5}: dues list, refunded part (S5.1.3)`,
    scan: "SCAN refunded",
    sqlHas: "WITH refunded AS",
  },
  {
    name: `${S5}: dues list, refund allocations (S5.1.3)`,
    scan: "SCAN ral",
    sqlHas: "WITH refunded AS",
  },
  {
    name: `${S5}: dues list, allocations per bill (S5.1.3)`,
    scan: "SCAN payment_allocations USING INDEX",
    sqlHas: "WITH refunded AS",
  },
  {
    name: `${S5}: dues list, all issued bills (S5.1.3)`,
    scan: "SCAN b USING INDEX",
    sqlHas: "WITH refunded AS",
  },
];
