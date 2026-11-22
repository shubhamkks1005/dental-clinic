export type ViewerFilters = {
  zoom: number;
  panX: number;
  panY: number;
  brightness: number;
  contrast: number;
  invert: boolean;
  rotate: number;
};

export const DEFAULT_VIEWER: ViewerFilters = {
  zoom: 1,
  panX: 0,
  panY: 0,
  brightness: 100,
  contrast: 100,
  invert: false,
  rotate: 0,
};

export function viewerFilterCss(f: ViewerFilters): string {
  const invert = f.invert ? " invert(1)" : "";
  return `brightness(${f.brightness}%) contrast(${f.contrast}%)${invert}`;
}

export function viewerTransformCss(f: ViewerFilters): string {
  return `translate(${f.panX}px, ${f.panY}px) scale(${f.zoom}) rotate(${f.rotate}deg)`;
}
