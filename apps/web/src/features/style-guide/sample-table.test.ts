import { firstPage } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import { samplePage } from "./sample-table";

describe("data table demo over 5,000 fake rows (1.4.5)", () => {
  it("pages, sorts and filters like a list endpoint", () => {
    const last = samplePage({ ...firstPage("code"), page: 200 });
    expect(last.rows).toHaveLength(25);
    expect(last.rows.at(-1)?.code).toBe("P-005000");
    expect(samplePage({ ...firstPage("code"), dir: "desc" }).rows[0]?.code).toBe("P-005000");
    expect(samplePage({ ...firstPage(), q: "p-004999" }).total).toBe(1);
    expect(samplePage({ ...firstPage(), q: "nobody" })).toMatchObject({ total: 0, rows: [] });
  });

  it("answers a sorted, filtered page of 5,000 rows quickly", () => {
    const started = performance.now();
    for (let i = 0; i < 10; i++) samplePage({ ...firstPage("name"), q: "a", page: 3 });
    expect((performance.now() - started) / 10).toBeLessThan(50);
  });
});
