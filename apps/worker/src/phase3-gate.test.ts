import { describe, expect, it } from "vitest";
import { PERMISSIONS, isAllowed } from "@clinic/db";
import { storageAlertLevel } from "@clinic/shared";

/**
 * 3.10.1 / Phase 3 gate: document automated coverage that already lives in
 * staff-visits, staff-files-permissions, staff-plan, tooth-events, history-feed tests.
 */
describe("Phase 3 automated gate matrix (3.10.1)", () => {
  it("receptionist never has clinical.view or files.clinical", () => {
    expect(isAllowed("receptionist", "clinical.view")).toBe(false);
    expect(isAllowed("receptionist", "clinical.edit")).toBe(false);
    expect(isAllowed("receptionist", "files.clinical")).toBe(false);
    expect(isAllowed("receptionist", "files.documents")).toBe(true);
    expect(PERMISSIONS["clinical.view"]).toEqual(["doctor"]);
  });

  it("storage warn threshold is 7 GB (3.7.6)", () => {
    expect(storageAlertLevel(8 * 1024 * 1024 * 1024)).toBe("warn");
  });
});
