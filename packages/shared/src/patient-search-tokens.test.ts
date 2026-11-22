import { describe, expect, it } from "vitest";
import { buildSearchTokens, searchWords, tokenRangeEnd } from "./patient-search-tokens";

describe("patient search tokens (2.1.6)", () => {
  it("builds name words without honorifics, mobile, reverse mobile, and code parts", () => {
    const tokens = buildSearchTokens({
      fullName: "Dr. Rahul Sharma",
      code: "P-000412",
      mobile: "+919876543210",
      mobileSecondary: null,
      legacyRef: "REG-99",
    });
    const byKind = (kind: string) => tokens.filter((t) => t.kind === kind).map((t) => t.token);
    expect(byKind("name").sort()).toEqual(["rahul", "sharma"]);
    expect(byKind("mobile")).toEqual(["9876543210"]);
    expect(byKind("mobile_rev")).toEqual(["0123456789"]);
    expect(byKind("code")).toEqual(expect.arrayContaining(["p-000412", "000412", "412"]));
    expect(byKind("legacy")).toEqual(["reg-99"]);
  });

  it("tokenRangeEnd is the exclusive prefix bound", () => {
    expect(tokenRangeEnd("ram")).toBe("ran");
    expect(tokenRangeEnd("3210")).toBe("3211");
  });

  it("searchWords lowercases and strips a leading P-", () => {
    expect(searchWords("  Rahul  Sharma ")).toEqual(["rahul", "sharma"]);
    expect(searchWords("P-000412")).toEqual(["000412"]);
  });
});
