import type { Affected } from "./chart-model";

type Props = {
  fdi: number;
  parts: Affected["parts"];
  colorOf: (code: string) => string | undefined;
  size?: number;
};

const RIGHT_SIDE = new Set(["1", "4", "5", "8"]);

/** The design's small tooth drawing (five zones, whole-tooth badge) for the printed sheet. */
export function ToothMini({ fdi, parts, colorOf, size = 28 }: Props) {
  const right = RIGHT_SIDE.has(String(fdi)[0] ?? "");
  const fill = (s: string) => {
    const p = parts.find((x) => x.surface === s);
    return p ? (colorOf(p.code) ?? "#d0e6f0") : "#ffffff";
  };
  const whole = parts.find((p) => p.surface === "whole");
  const left = right ? "d" : "m";
  const rightPart = right ? "m" : "d";
  return (
    <span className="vd-mini">
      <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden="true">
        <polygon points="2,2 34,2 25,11 11,11" fill={fill("b")} />
        <polygon points="34,2 34,34 25,25 25,11" fill={fill(rightPart)} />
        <polygon points="2,34 34,34 25,25 11,25" fill={fill("l")} />
        <polygon points="2,2 11,11 11,25 2,34" fill={fill(left)} />
        <rect x="11" y="11" width="14" height="14" fill={fill("o")} />
      </svg>
      {whole && <span className="vd-mini-badge">{whole.label.slice(0, 3).toUpperCase()}</span>}
      <span className="vd-mini-num">{fdi}</span>
    </span>
  );
}
