import { describe, expect, it } from "vitest";
import type { AppointmentStatus } from "@clinic/shared";
import { movesToChairOnOpen, primaryRowAction, statusActionButtons } from "./statusActions";

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

describe("primaryRowAction (Q2.5 one main button per row)", () => {
  const all: AppointmentStatus[] = ["arrived", "in_chair", "completed"];
  const row = (status: AppointmentStatus, payLink: string | null = null) =>
    primaryRowAction({ status, payLink, allowed: all });

  it("follows the patient through the day", () => {
    expect(row("scheduled")).toEqual({ status: "arrived", label: "Arrived" });
    expect(row("confirmed")).toEqual({ status: "arrived", label: "Arrived" });
    expect(row("arrived")).toEqual({ status: "in_chair", label: "Send in" });
    expect(row("in_chair")).toEqual({ status: "completed", label: "Done" });
  });

  it("a finished visit that is not paid shows Take payment, whatever the status", () => {
    expect(row("completed", "/app/bills/b1")).toEqual({
      pay: "/app/bills/b1",
      label: "Take payment",
    });
  });

  it("nothing to press for finished, missed or cancelled rows", () => {
    expect(row("completed")).toBeNull();
    expect(row("no_show")).toBeNull();
    expect(row("cancelled")).toBeNull();
  });

  it("never offers a step the rules do not allow", () => {
    expect(primaryRowAction({ status: "scheduled", payLink: null, allowed: [] })).toBeNull();
  });
});
