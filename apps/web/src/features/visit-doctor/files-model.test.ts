import { describe, expect, it } from "vitest";
import { fileLabel } from "./files-model";

describe("file label", () => {
  it("says kind, tooth and day", () => {
    const base = {
      kind: "iopa",
      toothFdi: 36,
      takenOn: "2026-11-22",
      createdAt: "2026-11-23T05:00:00.000Z",
    };
    expect(fileLabel(base)).toBe("X-ray (IOPA) 36 · 22 Nov 2026");
    expect(fileLabel({ ...base, toothFdi: null, takenOn: null })).toBe(
      "X-ray (IOPA) · 23 Nov 2026",
    );
    expect(fileLabel({ ...base, kind: "weird" })).toBe("File 36 · 22 Nov 2026");
  });
});
