import { formatMoney, plural, type DueAgeBucket } from "@clinic/shared";
import type { DuesRow } from "./api";

// Four cards on the Dues tab: total, then 0-30, 31-60 and over 60 days (Billing.dc.html).
export function AgeingCards({
  total,
  byBucket,
  rows,
}: {
  total: number;
  byBucket: Record<DueAgeBucket, number>;
  rows: DuesRow[];
}) {
  const count = (b: DueAgeBucket) => rows.filter((r) => r.bucket === b).length;
  return (
    <div className="ageing" aria-label="Dues by age">
      <section className="card ageing-card ageing-total">
        <p>Total due</p>
        <p className="ageing-value">{formatMoney(total)}</p>
        <p className="small">{plural(rows.length, "patient")}</p>
      </section>
      <section className="card ageing-card">
        <p className="muted">Up to 30 days</p>
        <p className="ageing-value">{formatMoney(byBucket["0-30"])}</p>
        <p className="small ageing-ok">{plural(count("0-30"), "patient")}</p>
      </section>
      <section className="card ageing-card">
        <p className="muted">31 to 60 days</p>
        <p className="ageing-value">{formatMoney(byBucket["31-60"])}</p>
        <p className="small ageing-warn">{plural(count("31-60"), "patient")}</p>
      </section>
      <section className="card ageing-card ageing-late">
        <p>Over 60 days</p>
        <p className="ageing-value">{formatMoney(byBucket["61+"])}</p>
        <p className="small">{plural(count("61+"), "patient")}</p>
      </section>
    </div>
  );
}
