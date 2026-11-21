import { describe, expect, it } from "vitest";
import { areaOf, isWorkerArea, type Area } from "./routing";

const cases: [string, Area][] = [
  ["/api/staff", "staff-api"],
  ["/api/staff/patients/1", "staff-api"],
  ["/api/staffing", "unknown-api"],
  ["/api/portal/me", "portal-api"],
  ["/api/other", "unknown-api"],
  ["/api", "unknown-api"],
  ["/hooks/sms", "hooks"],
  ["/hooksy", "asset"],
  ["/app", "staff-app"],
  ["/app/patients/1", "staff-app"],
  ["/application", "asset"],
  ["/my", "portal-app"],
  ["/my/bills", "portal-app"],
  ["/myself", "asset"],
  ["/", "asset"],
  ["/assets/index.js", "asset"],
];

describe("areaOf", () => {
  it.each(cases)("%s -> %s", (path, area) => {
    expect(areaOf(path)).toBe(area);
  });
});

describe("isWorkerArea", () => {
  it("only API and hook areas are handled by the Worker", () => {
    const worker = cases.filter(([path]) => isWorkerArea(areaOf(path))).map(([path]) => path);
    expect(worker).toEqual([
      "/api/staff",
      "/api/staff/patients/1",
      "/api/staffing",
      "/api/portal/me",
      "/api/other",
      "/api",
      "/hooks/sms",
    ]);
  });
});
