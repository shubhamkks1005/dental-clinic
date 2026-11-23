import { describe, expect, it } from "vitest";
import { testDb } from "../testing";
import type { Ctx } from "../context";
import { messagesOutboxRepo } from "./messages-outbox";

const doctor: Ctx = { userId: "doc1", role: "doctor", requestId: "req-msg" };

function baseInput(dedupeKey: string) {
  return {
    patientId: "pat1",
    kind: "confirm" as const,
    channel: "whatsapp_manual" as const,
    templateKey: "confirm",
    params: { naam: "Meena" },
    body: "Dear Meena, test.",
    segments: 1,
    status: "needs_human" as const,
    dedupeKey,
    sendAfter: "2026-11-23T10:00:00.000Z",
    expireAt: "2026-11-24T10:00:00.000Z",
  };
}

describe("message_outbox (7.2.1)", () => {
  it("rejects duplicate dedupe_key and uses status+send_after index", async () => {
    const { db, sqlite } = testDb();
    const repo = messagesOutboxRepo(db, doctor);
    const a = await repo.enqueue(baseInput("confirm:APPT1:START"));
    expect(a.created).toBe(true);
    const b = await repo.enqueue(baseInput("confirm:APPT1:START"));
    expect(b.created).toBe(false);
    expect(b.id).toBe(a.id);

    const plan = sqlite
      .prepare(
        "EXPLAIN QUERY PLAN SELECT id FROM message_outbox WHERE status = 'queued' AND send_after <= ? ORDER BY send_after LIMIT 5",
      )
      .all("2026-11-24T00:00:00.000Z")
      .map((r) => JSON.stringify(r))
      .join(" ");
    expect(plan.toLowerCase()).toMatch(/message_outbox_status_send_idx|using index|search/);
  });

  it("marks opened_in_whatsapp with audit", async () => {
    const { db, sqlite } = testDb();
    const repo = messagesOutboxRepo(db, doctor);
    const { id } = await repo.enqueue(baseInput("confirm:APPT2:START"));
    const row = await repo.markOpenedInWhatsApp(id);
    expect(row.status).toBe("opened_in_whatsapp");
    const audits = sqlite
      .prepare("SELECT action, after_json FROM audit_log WHERE table_name = 'message_outbox'")
      .all() as { action: string; after_json: string }[];
    expect(audits.some((a) => a.after_json.includes("opened_in_whatsapp"))).toBe(true);
  });
});
