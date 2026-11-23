import { createDb, createRepos } from "@clinic/db";
import { describe, expect, it } from "vitest";
import { makeEnv } from "../testing/app-env";
import { messagingMode, pickAdapter } from "../domain/messages";

describe("messaging dispatcher (7.2.5 / 7.9.1)", () => {
  it("MESSAGING_MODE defaults to dry_run", () => {
    expect(messagingMode("dry_run")).toBe("dry_run");
    expect(messagingMode("live")).toBe("live");
    expect(messagingMode(undefined)).toBe("dry_run");
  });

  it("claims each message once across two ticks (no double send)", async () => {
    const { env } = makeEnv();
    const db = createDb(env.DB);
    const repos = createRepos(db, {
      userId: "doc1",
      role: "doctor",
      requestId: "t-msg",
    });
    for (let i = 0; i < 8; i++) {
      await repos.messages.enqueue({
        patientId: `p${i}`,
        appointmentId: `a${i}`,
        kind: "confirm",
        channel: "sms",
        templateKey: "confirm",
        params: {},
        body: "Dear Meena, test.",
        segments: 1,
        status: "queued",
        dedupeKey: `confirm:a${i}:t`,
        sendAfter: "2020-01-01T00:00:00.000Z",
        expireAt: "2099-01-01T00:00:00.000Z",
        audit: false,
      });
    }
    const claimed1 = await repos.messages.claimDue("2026-11-23T10:00:00.000Z", 5);
    const claimed2 = await repos.messages.claimDue("2026-11-23T10:00:00.000Z", 5);
    const ids = new Set([...claimed1, ...claimed2].map((r) => r.id));
    expect(ids.size).toBe(claimed1.length + claimed2.length);
    expect(claimed1.length).toBe(5);
    expect(claimed2.length).toBe(3);

    for (const row of claimed1) {
      const adapter = pickAdapter("sms", "dry_run");
      const result = await adapter.send({ id: row.id, toMobile: "+919000000000", body: row.body });
      expect(result.ok).toBe(true);
      await repos.messages.setStatus(row.id, "dry_run");
    }
  });
});
