type Col = { key: string; label: string };
type Row = Record<string, string | number>;

type Props = { columns: Col[]; rows: Row[]; caption: string };

export function ChartDataTable({ columns, rows, caption }: Props) {
  return (
    <div className="chart-table-wrap">
      <table className="chart-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
