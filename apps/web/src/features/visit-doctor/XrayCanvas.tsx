import {
  ANNOTATION_H,
  ANNOTATION_W,
  type AnnotationItem,
  type FileAnnotations,
} from "@clinic/shared";
import { useRef, useState } from "react";
import { fileContentUrl } from "../files/api";
import { XrayMark } from "./XrayMark";
import {
  adjustFilter,
  makeMark,
  toViewerPoint,
  viewTransform,
  type Adjust,
  type Tool,
  type View,
} from "./xray-model";

type Props = {
  fileId: string;
  prevFileId: string | null;
  compare: boolean;
  view: View;
  adjust: Adjust;
  tool: Tool;
  width: number;
  text: string;
  scale: FileAnnotations["scale"];
  items: AnnotationItem[];
  canEdit: boolean;
  onView: (v: View) => void;
  onAdd: (item: AnnotationItem) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
};

const COLOR = "#E11D48";
const newId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The picture with its marks. Pan by dragging, zoom with the wheel, draw with the chosen tool. */
export function XrayCanvas(p: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<null | {
    a: [number, number];
    b: [number, number];
    path: [number, number][];
  }>(null);
  const pan = useRef<null | { sx: number; sy: number; x: number; y: number }>(null);
  const filter = adjustFilter(p.adjust);
  const url = fileContentUrl(p.fileId);

  const point = (e: React.PointerEvent): [number, number] => {
    const r = box.current?.getBoundingClientRect();
    return r ? toViewerPoint(e.clientX, e.clientY, r) : [0, 0];
  };

  function down(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (p.tool === "pan" || !p.canEdit) {
      pan.current = { sx: e.clientX, sy: e.clientY, x: p.view.x, y: p.view.y };
      return;
    }
    const a = point(e);
    if (p.tool === "text") {
      const item = makeMark("text", newId(), a, a, {
        width: p.width,
        text: p.text,
        color: COLOR,
        path: [],
      });
      if (item) p.onAdd(item);
      return;
    }
    setDrag({ a, b: a, path: [a] });
  }
  function move(e: React.PointerEvent) {
    if (pan.current) {
      p.onView({
        ...p.view,
        x: pan.current.x + e.clientX - pan.current.sx,
        y: pan.current.y + e.clientY - pan.current.sy,
      });
    } else if (drag) {
      const b = point(e);
      setDrag({ a: drag.a, b, path: p.tool === "pen" ? [...drag.path, b] : drag.path });
    }
  }
  function up() {
    pan.current = null;
    if (!drag || p.tool === "pan" || p.tool === "text") return setDrag(null);
    const item = makeMark(p.tool, newId(), drag.a, drag.b, {
      width: p.width,
      text: p.text,
      color: COLOR,
      path: drag.path,
    });
    if (item) p.onAdd(item);
    setDrag(null);
  }

  const preview =
    drag && p.tool !== "pan" && p.tool !== "text"
      ? makeMark(p.tool, "preview", drag.a, drag.b, {
          width: p.width,
          text: "",
          color: COLOR,
          path: drag.path,
        })
      : null;
  const style = { transform: viewTransform(p.view), filter };

  if (p.compare) {
    return (
      <div className="vd-xv-compare">
        <figure>
          <figcaption>Previous</figcaption>
          {p.prevFileId ? (
            <img alt="Previous picture" src={fileContentUrl(p.prevFileId)} style={style} />
          ) : (
            <p className="vd-hint">No earlier picture.</p>
          )}
        </figure>
        <figure>
          <figcaption>Current (sync zoom &amp; pan)</figcaption>
          <img alt="Current picture" src={url} style={style} />
        </figure>
      </div>
    );
  }

  return (
    <div
      className="vd-xv-stage"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onWheel={(e) =>
        p.onView({ ...p.view, zoom: Math.max(0.4, Math.min(6, p.view.zoom - e.deltaY / 1000)) })
      }
      data-tool={p.tool}
    >
      <div className="vd-xv-wrap" ref={box} style={{ transform: viewTransform(p.view) }}>
        <img alt="X-ray" src={url} draggable={false} style={{ filter }} />
        <svg
          viewBox={`0 0 ${ANNOTATION_W} ${ANNOTATION_H}`}
          preserveAspectRatio="none"
          aria-label="Marks"
        >
          {p.items.map((m) => (
            <XrayMark
              key={m.id}
              m={m}
              scale={p.scale}
              actions={
                p.canEdit
                  ? {
                      onRemove: () => p.onRemove(m.id),
                      onMove: (dx, dy) => p.onMove(m.id, dx, dy),
                      toViewer: (e) => {
                        const r = box.current?.getBoundingClientRect();
                        return r ? toViewerPoint(e.clientX, e.clientY, r) : [0, 0];
                      },
                    }
                  : undefined
              }
            />
          ))}
          {preview && <XrayMark m={preview} scale={p.scale} />}
        </svg>
      </div>
    </div>
  );
}
