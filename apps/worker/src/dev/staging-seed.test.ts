import { describe, expect, it } from "vitest";
import { addStaff, makeEnv } from "../testing/app-env";
import { runStagingSeed } from "./staging-seed";

const NOW = new Date("2026-11-23T06:00:00Z");

describe("staging seed", () => {
  it("builds the fake clinic through domain functions", async () => {
    const { env, sqlite } = makeEnv();
    addStaff(sqlite, { id: "doc-a", email: "doc@example.test" }); // test-only fake doctor
    const r = await runStagingSeed(env.DB as never, NOW);
    expect(r.patients).toBe(30);
    expect(r.appointments).toBeGreaterThan(40);
    expect(r.visitsFinal).toBeGreaterThan(5);
    expect(r.visitsOpen).toBeGreaterThan(0);
    expect(r.prescriptions).toBeGreaterThan(2);
    expect(r.bills).toBeGreaterThan(5);
    expect(r.refunds).toBe(1);
    expect(r.requests).toBe(3);
    expect(r.skipped.length).toBeLessThan(5);
    expect(r.closedDay).toBe("2026-11-16");
    const count = (q: string) => (sqlite.prepare(q).get() as { n: number }).n;
    expect(count("SELECT COUNT(*) n FROM payments WHERE split_mode IS NOT NULL")).toBeGreaterThan(
      0,
    );
    expect(count("SELECT COUNT(*) n FROM audit_log")).toBeGreaterThan(100);
    expect(count("SELECT COUNT(*) n FROM patients WHERE guardian_name IS NOT NULL")).toBe(4);
  });
});
