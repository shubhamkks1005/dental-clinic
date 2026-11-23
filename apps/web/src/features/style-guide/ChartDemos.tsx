import { BarChart, Heatmap, KpiTile, LineChart, Sparkline, StackedBarChart } from "../../ui/charts";

/** FAKE sample charts for /app/style-guide (6.3.2). */
export function ChartDemos() {
  return (
    <div className="chart-demos">
      <p className="muted">
        Tab to a chart, use arrow keys for values, or Show table. Sample data only (6.3.2).
      </p>
      <div className="chart-demos-kpis">
        <KpiTile label="Arrived today" value="14" note="Was 12 last week" tone="up" />
        <KpiTile label="New this month" value="28" note={<SparkNote />} tone="flat" />
        <KpiTile label="Collected" value="₹1.2L" note="+₹8,000 vs last month" tone="up" />
        <KpiTile
          label="Outstanding"
          value="₹24,500"
          note="Thin data (under 20 events)"
          tone="thin"
        />
      </div>
      <BarChart
        title="Patients by day"
        unit="patients"
        data={[
          { label: "Mon", value: 8 },
          { label: "Tue", value: 12 },
          { label: "Wed", value: 10 },
          { label: "Thu", value: 15 },
          { label: "Fri", value: 9 },
          { label: "Sat", value: 11 },
        ]}
      />
      <StackedBarChart
        title="New and returning"
        keys={[
          { key: "new", label: "New" },
          { key: "ret", label: "Returning" },
        ]}
        data={[
          {
            label: "Sep",
            parts: [
              { key: "new", value: 20 },
              { key: "ret", value: 40 },
            ],
          },
          {
            label: "Oct",
            parts: [
              { key: "new", value: 25 },
              { key: "ret", value: 38 },
            ],
          },
          {
            label: "Nov",
            parts: [
              { key: "new", value: 28 },
              { key: "ret", value: 45 },
            ],
          },
        ]}
      />
      <LineChart
        title="Collected (fake ₹ thousands)"
        unit="k"
        data={[
          { label: "W1", value: 80 },
          { label: "W2", value: 95 },
          { label: "W3", value: 70 },
          { label: "W4", value: 110 },
        ]}
      />
      <Heatmap
        title="Busy hours (arrived)"
        cells={[
          { row: "Mon", col: "10", value: 2 },
          { row: "Mon", col: "11", value: 5 },
          { row: "Mon", col: "12", value: 1 },
          { row: "Tue", col: "10", value: 3 },
          { row: "Tue", col: "11", value: 8 },
          { row: "Tue", col: "12", value: 2 },
          { row: "Wed", col: "10", value: 1 },
          { row: "Wed", col: "11", value: 4 },
          { row: "Wed", col: "12", value: 3 },
        ]}
      />
    </div>
  );
}

function SparkNote() {
  return (
    <>
      Trend <Sparkline values={[18, 20, 22, 19, 28]} label="New patients sparkline" /> vs last month
      22
    </>
  );
}
