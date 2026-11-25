import { describe, expect, it } from "vitest";
import { qrFileProblem } from "./qr-file";

describe("QR file check", () => {
  it("accepts a small PNG or JPEG", () => {
    expect(qrFileProblem({ type: "image/png", size: 3000 })).toBeNull();
    expect(qrFileProblem({ type: "image/jpeg", size: 40_000 })).toBeNull();
  });
  it("refuses other types and big files with one sentence", () => {
    expect(qrFileProblem({ type: "image/gif", size: 10 })).toBe("Use a PNG or JPEG picture.");
    expect(qrFileProblem({ type: "application/pdf", size: 10 })).toBe("Use a PNG or JPEG picture.");
    expect(qrFileProblem({ type: "image/png", size: 40_001 })).toBe(
      "The picture is too big. Use one under 40 KB.",
    );
  });
});
