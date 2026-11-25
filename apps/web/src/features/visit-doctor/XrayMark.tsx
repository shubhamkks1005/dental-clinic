import type { AnnotationItem, FileAnnotations } from "@clinic/shared";
import { anchorOf, markColor, measureLabel } from "./xray-model";

export type MarkActions = {
  onRemove: () => void;
  onMove: (dx: number, dy: number) => void;
  /** A pointer position in viewer units (0-400 by 0-300). */
  toViewer: (e: { clientX: number; clientY: number }) => [number, number];
};

/** One mark on the picture. With `actions`, a move and a delete button show on hover (120 ms fade). */
export function XrayMark({
  m,
  scale,
  actions,
}: {
  m: AnnotationItem;
  scale: FileAnnotations["scale"];
  actions?: MarkActions;
}) {
  const color = markColor(m);
  const line = {
    stroke: color,
    strokeWidth: m.width ?? 2.5,
    fill: "none",
    vectorEffect: "non-scaling-stroke" as const,
  };
  let shape: React.ReactNode;
  if (m.type === "pen") {
    shape = <polyline {...line} points={m.points.map((p) => p.join(",")).join(" ")} />;
  } else if (m.type === "circle") {
    shape = <circle {...line} cx={m.cx} cy={m.cy} r={m.r} />;
  } else if (m.type === "text") {
    shape = (
      <text x={m.x} y={m.y} fill={color} fontSize="12">
        {m.text}
      </text>
    );
  } else {
    shape = (
      <g>
        <line {...line} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} />
        {m.type === "measure" && (
          <text x={(m.x1 + m.x2) / 2} y={(m.y1 + m.y2) / 2 - 3} fill={color} fontSize="11">
            {measureLabel(m, scale)}
          </text>
        )}
      </g>
    );
  }
  if (!actions) return <g>{shape}</g>;

  const anc = anchorOf(m);
  function startMove(e: React.PointerEvent<SVGGElement>) {
    if (!actions) return;
    e.stopPropagation();
    let last = actions.toViewer(e);
    const move = (ev: PointerEvent) => {
      const p = actions.toViewer(ev);
      actions.onMove(p[0] - last[0], p[1] - last[1]);
      last = p;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <g className="vd-xv-item">
      {shape}
      <g className="vd-xv-actions" transform={`translate(${anc.x - 10}, ${anc.y - 9})`}>
        <g
          className="vd-xv-move"
          role="button"
          aria-label="Move this mark"
          onPointerDown={startMove}
        >
          <rect
            x="-11"
            y="0"
            width="10"
            height="10"
            rx="2.5"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="0.8"
          />
          <text
            x="-6"
            y="7.5"
            fill="#38bdf8"
            fontSize="7.5"
            textAnchor="middle"
            pointerEvents="none"
          >
            ✥
          </text>
        </g>
        <g
          className="vd-xv-del"
          role="button"
          aria-label="Delete this mark"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            actions.onRemove();
          }}
        >
          <rect
            x="1"
            y="0"
            width="10"
            height="10"
            rx="2.5"
            fill="#dc2626"
            stroke="#fecaca"
            strokeWidth="0.8"
          />
          <text
            x="6"
            y="7.5"
            fill="#ffffff"
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
            pointerEvents="none"
          >
            ×
          </text>
        </g>
      </g>
    </g>
  );
}
