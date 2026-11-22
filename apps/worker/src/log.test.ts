import { describe, expect, it, vi } from "vitest";
import { requestPath, sanitizeLog, writeLog } from "./log";

describe("structured logs (1.6.1)", () => {
  it("keeps safe fields and drops patient name, mobile and diagnosis keys", () => {
    expect(
      sanitizeLog({
        msg: "request",
        requestId: "abc",
        name: "Rohan Mehta",
        mobile: "9876543210",
        diagnosis: "caries",
        patientName: "secret",
        nested: { phone: "9", status: 200 },
        status: 200,
      }),
    ).toEqual({
      msg: "request",
      requestId: "abc",
      nested: { status: 200 },
      status: 200,
    });
  });

  it("logs the pathname only, never the query string", () => {
    expect(requestPath("https://clinic.test/api/staff/patients?search=Rohan")).toBe(
      "/api/staff/patients",
    );
  });

  it("writes one JSON line; banned fields never appear in the text", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    writeLog("info", {
      msg: "request",
      requestId: "ray-1",
      name: "must not print",
      mobile: "9000000000",
      path: "/api/staff/me",
    });
    const line = String(log.mock.calls[0]?.[0]);
    expect(() => JSON.parse(line)).not.toThrow();
    expect(line).toContain('"requestId":"ray-1"');
    expect(line).not.toMatch(/must not print|9000000000|Rohan/i);
    log.mockRestore();
  });
});
