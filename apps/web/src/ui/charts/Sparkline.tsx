import { sparkPath } from "./chart-math";

type Props = { values: number[]; label: string; width?: number; height?: number };

export function Sparkline({ values, label, width = 72, height = 24 }: Props) {
  const d = sparkPath(values, width, height);
  return (
    <svg
      className="chart-spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
    >
      <path d={d} fill="none" stroke="var(--blue)" strokeWidth="2" />
    </svg>
  );
}
