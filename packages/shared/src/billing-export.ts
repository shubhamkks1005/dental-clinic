/** 5.3.12 CA monthly CSV helpers (fake data only in tests). */

export type BillingExportRow = {
  date: string;
  billNumber: string;
  patientCode: string;
  procedureGroup: string;
  taxCategory: string;
  amountPaise: number;
  discountPaise: number;
  taxPaise: number;
  /** e.g. cash:10000;upi:5000 */
  modes: string;
};

const HEADER =
  "date,bill_number,patient_code,procedure_group,tax_category,amount_paise,discount_paise,tax_paise,modes";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function billingExportToCsv(rows: BillingExportRow[]): string {
  const lines = [HEADER];
  for (const r of rows) {
    lines.push(
      [
        r.date,
        csvEscape(r.billNumber),
        csvEscape(r.patientCode),
        csvEscape(r.procedureGroup),
        csvEscape(r.taxCategory),
        String(r.amountPaise),
        String(r.discountPaise),
        String(r.taxPaise),
        csvEscape(r.modes),
      ].join(","),
    );
  }
  return lines.join("\n") + "\n";
}

export function parseMonthParam(
  raw: unknown,
): { ok: true; month: string } | { ok: false; message: string } {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}$/.test(raw)) {
    return { ok: false, message: "Use a month like 2026-11." };
  }
  const monthNum = Number(raw.slice(5));
  if (monthNum < 1 || monthNum > 12) {
    return { ok: false, message: "Use a month like 2026-11." };
  }
  return { ok: true, month: raw };
}
