import type { DashboardPayload } from "@clinic/shared";
import { formatRupees } from "@clinic/shared";
import { BarChart, Heatmap, LineChart, StackedBarChart } from "../../ui/charts";

type Props = { data: DashboardPayload };

/** Charts for the selected range (6.3.3). */
export function DashboardCharts({ data }: Props) {
  const patients = data.series.map((s) => ({
    label: shortKey(s.key),
    value: s.arrived,
  }));
  const stacked = data.series.map((s) => ({
    label: shortKey(s.key),
    parts: [
      { key: "new", value: s.newPatients },
      { key: "ret", value: s.returning },
    ],
  }));
  const money = data.series.map((s) => ({
    label: shortKey(s.key),
    value: Math.round(s.collectedPaise / 100),
  }));
  const appt = data.apptStatus.map((a) => ({
    label: a.dim.replace(/_/g, " "),
    value: a.value,
  }));
  const procedures = data.procedures.map((p) => ({ label: p.dim, value: p.value }));
  const referrals = data.referrals.map((r) => ({ label: r.dim, value: r.value }));

  return (
    <div className="dash-charts">
      {thin(patients.map((p) => p.value)) ? (
        <NotEnough title="Patients arrived" />
      ) : (
        <BarChart title="Patients arrived" unit="patients" data={patients} />
      )}
      {thin(data.series.map((s) => s.newPatients + s.returning)) ? (
        <NotEnough title="New and returning" />
      ) : (
        <StackedBarChart
          title="New and returning"
          keys={[
            { key: "new", label: "New" },
            { key: "ret", label: "Returning" },
          ]}
          data={stacked}
        />
      )}
      {thin(money.map((m) => m.value)) ? (
        <NotEnough title="Collected (rupees)" />
      ) : (
        <LineChart title="Collected (rupees)" unit="₹" data={money} />
      )}
      {appt.length > 0 ? <BarChart title="Appointment status" data={appt} /> : null}
      {procedures.length > 0 ? <BarChart title="Top procedures" data={procedures} /> : null}
      {referrals.length > 0 ? <BarChart title="Top referral sources" data={referrals} /> : null}
      {data.busyHeat.length > 0 ? (
        <Heatmap title="Busy hours (arrived)" cells={data.busyHeat} />
      ) : null}
      {data.compareTotals ? (
        <p className="dash-compare-note muted">
          Previous period: {data.compareTotals.arrived} arrived,{" "}
          {formatRupees(data.compareTotals.collectedPaise)} collected.
        </p>
      ) : null}
    </div>
  );
}

/** Fewer than two days or weeks with anything in them: a chart would only show a dot. */
function thin(values: number[]): boolean {
  return values.filter((v) => v > 0).length < 2;
}

function NotEnough({ title }: { title: string }) {
  return (
    <section className="card dash-thin" aria-label={title}>
      <h3>{title}</h3>
      <p className="muted">Not enough data yet.</p>
    </section>
  );
}

function shortKey(key: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key.slice(8);
  if (/^\d{4}-\d{2}$/.test(key)) return key.slice(5);
  return key;
}
