import { describe, expect, it } from "vitest";
import type { BoardMessage, MessagesBoard } from "./api";
import { groupByPatient, tabCount } from "./message-groups";

function row(id: string, patientId: string, over: Partial<BoardMessage> = {}): BoardMessage {
  return {
    id,
    patientId,
    appointmentId: `a-${patientId}`,
    kind: "confirm",
    channel: "whatsapp",
    templateKey: "confirm",
    body: "Dear X",
    status: "needs_human",
    sendAfter: "2026-11-24T05:00:00Z",
    expireAt: "2026-11-25T05:00:00Z",
    skipReason: null,
    createdAt: "2026-11-24T05:00:00Z",
    attempts: 0,
    lastErrorCode: null,
    patientName: `Patient ${patientId}`,
    patientCode: "P-000001",
    sentTo: null,
    booking: { dateLocal: "2026-11-25", startMin: 660 },
    ...over,
  };
}

const empty: MessagesBoard = {
  outgoing: [],
  scheduled: [],
  outOfDate: [],
  sentToday: [],
  attention: [],
  whatsapp: [],
  noNumber: [],
};

describe("message groups", () => {
  it("puts a patient's ready, later and withdrawn messages on one card", () => {
    const board = {
      ...empty,
      whatsapp: [row("m1", "p1")],
      outgoing: [row("m1", "p1")],
      scheduled: [row("m2", "p1", { kind: "remind", status: "queued" })],
      outOfDate: [row("m3", "p1", { status: "cancelled", skipReason: "out_of_date" })],
    };
    const groups = groupByPatient(board, "send");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.rows.map((r) => r.id)).toEqual(["m1"]);
    expect(groups[0]?.later.map((r) => r.id)).toEqual(["m2"]);
    expect(groups[0]?.withdrawn.map((r) => r.id)).toEqual(["m3"]);
    expect(tabCount(board, "send")).toBe(1);
  });

  it("a scheduled-only patient still gets a card", () => {
    const board = { ...empty, scheduled: [row("m2", "p2", { kind: "remind" })] };
    expect(groupByPatient(board, "send")).toHaveLength(1);
    expect(tabCount(board, "send")).toBe(0);
  });

  it("no-number rows are not on the attention tab (they have their own card)", () => {
    const board = { ...empty, attention: [row("m4", "p3", { skipReason: "no_number" })] };
    expect(tabCount(board, "attention")).toBe(0);
  });
});
