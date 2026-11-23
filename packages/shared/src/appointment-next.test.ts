import { describe, expect, it } from "vitest";
import { pickNextAppointment } from "./appointment-next";

const now = new Date("2026-11-24T06:30:00.000Z"); // 12:00 IST, 24 Nov
const row = (id: string, status: string, dateLocal: string, startMin: number) => ({
  id,
  status,
  dateLocal,
  startMin,
});

describe("pickNextAppointment (Q1.8)", () => {
  it("skips today's walk-in that is already in the chair and takes tomorrow's booking", () => {
    const next = pickNextAppointment(
      [
        row("walkin", "in_chair", "2026-11-24", 11 * 60),
        row("tomorrow", "scheduled", "2026-11-25", 600),
      ],
      now,
    );
    expect(next?.id).toBe("tomorrow");
  });
  it("skips a booking earlier today and picks one later today first", () => {
    const next = pickNextAppointment(
      [
        row("past", "scheduled", "2026-11-24", 9 * 60),
        row("later", "confirmed", "2026-11-24", 15 * 60),
        row("tomorrow", "scheduled", "2026-11-25", 600),
      ],
      now,
    );
    expect(next?.id).toBe("later");
  });
  it("is null when nothing is ahead", () => {
    expect(pickNextAppointment([row("c", "cancelled", "2026-11-25", 600)], now)).toBeNull();
  });
});
