import { describe, expect, it } from "vitest";
import {
  canMakeImageThumb,
  fitWithin,
  PHOTO_MAX_EDGE,
  shouldRecompressOriginal,
  THUMB_MAX_EDGE,
} from "./prepare-size";

describe("prepare-size (3.7.3)", () => {
  it("fits long edge to max without upsizing", () => {
    expect(fitWithin(4000, 3000, PHOTO_MAX_EDGE)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(800, 600, PHOTO_MAX_EDGE)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1200, 900, THUMB_MAX_EDGE)).toEqual({ width: 300, height: 225 });
  });

  it("only recompresses phone photos, not X-rays", () => {
    expect(shouldRecompressOriginal("photo")).toBe(true);
    expect(shouldRecompressOriginal("iopa")).toBe(false);
    expect(shouldRecompressOriginal("opg")).toBe(false);
    expect(shouldRecompressOriginal("scan")).toBe(false);
  });

  it("thumbs only for common image mime types", () => {
    expect(canMakeImageThumb("image/jpeg")).toBe(true);
    expect(canMakeImageThumb("application/pdf")).toBe(false);
  });
});
