import type { ViewerFilters } from "./file-viewer-state";
import { NativeInput } from "../../ui/form";

type Props = {
  value: ViewerFilters;
  onChange: (next: ViewerFilters) => void;
};

export function FileViewerControls({ value, onChange }: Props) {
  const set = (patch: Partial<ViewerFilters>) => onChange({ ...value, ...patch });

  return (
    <div className="file-viewer-controls" role="group" aria-label="Image controls">
      <label>
        Zoom
        <NativeInput
          type="range"
          min={0.5}
          max={4}
          step={0.1}
          value={value.zoom}
          onChange={(e) => set({ zoom: Number(e.target.value) })}
        />
      </label>
      <label>
        Brightness
        <NativeInput
          type="range"
          min={50}
          max={150}
          value={value.brightness}
          onChange={(e) => set({ brightness: Number(e.target.value) })}
        />
      </label>
      <label>
        Contrast
        <NativeInput
          type="range"
          min={50}
          max={150}
          value={value.contrast}
          onChange={(e) => set({ contrast: Number(e.target.value) })}
        />
      </label>
      <button type="button" onClick={() => set({ invert: !value.invert })}>
        {value.invert ? "Invert on" : "Invert"}
      </button>
      <button type="button" onClick={() => set({ rotate: (value.rotate + 90) % 360 })}>
        Rotate
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            zoom: 1,
            panX: 0,
            panY: 0,
            brightness: 100,
            contrast: 100,
            invert: false,
            rotate: 0,
          })
        }
      >
        Reset
      </button>
    </div>
  );
}
