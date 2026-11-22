import { describe, expect, it } from "vitest";
import { actionForFileKind, parseFileUploadMeta } from "./files";

describe("files helpers (3.7.2)", () => {
  it("maps kinds to permissions", () => {
    expect(actionForFileKind("iopa")).toBe("files.clinical");
    expect(actionForFileKind("scan")).toBe("files.documents");
    expect(actionForFileKind("consent")).toBe("files.documents");
    expect(actionForFileKind("logo")).toBeNull();
  });

  it("parses upload meta", () => {
    const ok = parseFileUploadMeta({ kind: "scan", caption: "ID proof" });
    expect(ok.ok).toBe(true);
    const bad = parseFileUploadMeta({ kind: "logo" });
    expect(bad.ok).toBe(false);
  });
});
