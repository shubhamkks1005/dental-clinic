import { describe, expect, it } from "vitest";
import { shortRequestId } from "./request-id";

describe("short error id (1.4.7)", () => {
  it("takes the first 8 letters or digits, upper case", () => {
    expect(shortRequestId("8c2a1b3c4d5e6f70-BOM")).toBe("8C2A1B3C");
    expect(shortRequestId("1f2e3d4c-5b6a-4789-8abc-def012345678")).toBe("1F2E3D4C");
  });
});
