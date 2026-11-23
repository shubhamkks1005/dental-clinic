import { describe, expect, it } from "vitest";
import { movesToChairOnOpen, statusActionButtons } from "./statusActions";

describe("statusActionButtons (2.3.6 UI)", () => {
  const startAt = new Date("2026-11-23T04:30:00.000Z");
  const statusChangedAt = startAt;

  it("shows only allowed next actions; hides no_show until after start+15m", () => {
    const early = statusActionButtons("scheduled", {
      startAt,
      statusChangedAt,
      now: startAt,
    }).map((b) => b.status);
    expect(early).toContain("confirmed");
    expect(early).toContain("arrived");
    expect(early).not.toContain("no_show");
    expect(early).not.toContain("completed");

    const late = statusActionButtons("scheduled", {
      startAt,
      statusChangedAt,
      now: new Date(startAt.getTime() + 20 * 60 * 1000),
    }).map((b) => b.status);
    expect(late).toContain("no_show");
  });

  it("completed has no actions", () => {
    expect(statusActionButtons("completed", { startAt, statusChangedAt, now: startAt })).toEqual(
      [],
    );
  });

  it("opening a visit moves scheduled, confirmed and arrived patients to the chair only", () => {
    expect(movesToChairOnOpen("scheduled")).toBe(true);
    expect(movesToChairOnOpen("confirmed")).toBe(true);
    expect(movesToChairOnOpen("arrived")).toBe(true);
    expect(movesToChairOnOpen("in_chair")).toBe(false);
    expect(movesToChairOnOpen("completed")).toBe(false);
    expect(movesToChairOnOpen("no_show")).toBe(false);
  });
});
