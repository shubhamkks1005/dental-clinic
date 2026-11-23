import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reportBrowserError, resetReportedErrorsForTest, toReport } from "./report";

beforeEach(() => {
  resetReportedErrorsForTest();
  vi.stubGlobal("window", { location: { pathname: "/app/today" } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}")),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("browser error reporter (9.2.5)", () => {
  it("sends only name, short message and path", () => {
    const r = toReport(new TypeError("x  is not\na function"), "/app/today");
    expect(r).toMatchObject({
      kind: "TypeError",
      message: "x is not a function",
      path: "/app/today",
    });
    expect(Object.keys(r).sort()).toEqual(["kind", "message", "path"]);
  });

  it("caps the message and survives odd values", () => {
    expect(toReport("a".repeat(500), "/").message).toHaveLength(200);
    expect(toReport(undefined, "/")).toMatchObject({ kind: "Error", message: "Unknown error" });
  });

  it("reports the same error once", () => {
    expect(reportBrowserError(new Error("boom"))).toBe(true);
    expect(reportBrowserError(new Error("boom"))).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("never throws, even when fetch itself throws", () => {
    vi.stubGlobal("fetch", () => {
      throw new Error("offline");
    });
    expect(() => reportBrowserError(new Error("again"))).not.toThrow();
  });
});
