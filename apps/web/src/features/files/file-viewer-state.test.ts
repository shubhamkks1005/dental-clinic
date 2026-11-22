import { describe, expect, it } from "vitest";
import { DEFAULT_VIEWER, viewerFilterCss, viewerTransformCss } from "./file-viewer-state";

describe("file viewer css (3.7.4)", () => {
  it("builds filter and transform from controls", () => {
    const f = {
      ...DEFAULT_VIEWER,
      brightness: 120,
      contrast: 90,
      invert: true,
      zoom: 2,
      rotate: 90,
    };
    expect(viewerFilterCss(f)).toContain("brightness(120%)");
    expect(viewerFilterCss(f)).toContain("invert(1)");
    expect(viewerTransformCss(f)).toContain("scale(2)");
    expect(viewerTransformCss(f)).toContain("rotate(90deg)");
  });
});
