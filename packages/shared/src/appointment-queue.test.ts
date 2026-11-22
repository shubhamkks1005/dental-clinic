import { describe, expect, it } from "vitest";
import { formatWaiting, sortWaitingQueue, waitingMinutes } from "./appointment-queue";

describe("waiting queue (2.3.7)", () => {
  it("puts emergency ahead of three earlier walk-ins", () => {
    const ordered = sortWaitingQueue([
      {
        id: "w1",
        priority: "normal",
        arrivedAt: "2026-11-23T04:10:00.000Z",
        createdAt: "2026-11-23T04:10:00.000Z",
      },
      {
        id: "w2",
        priority: "normal",
        arrivedAt: "2026-11-23T04:20:00.000Z",
        createdAt: "2026-11-23T04:20:00.000Z",
      },
      {
        id: "w3",
        priority: "normal",
        arrivedAt: "2026-11-23T04:30:00.000Z",
        createdAt: "2026-11-23T04:30:00.000Z",
      },
      {
        id: "e1",
        priority: "emergency",
        arrivedAt: "2026-11-23T04:35:00.000Z",
        createdAt: "2026-11-23T04:35:00.000Z",
      },
    ]).map((r) => r.id);
    expect(ordered).toEqual(["e1", "w1", "w2", "w3"]);
  });

  it("formats how long they have been waiting", () => {
    const arrived = "2026-11-23T04:00:00.000Z";
    const now = new Date("2026-11-23T04:12:30.000Z");
    expect(waitingMinutes(arrived, now)).toBe(12);
    expect(formatWaiting(arrived, now)).toBe("Waiting 12 min");
    expect(waitingMinutes(null, now)).toBeNull();
  });
});
