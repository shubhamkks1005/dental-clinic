import { describe, expect, it } from "vitest";
import { createKeyedQueue, diagFromPage, insertAt, procFromPage, tempKey } from "./line-state";

describe("lines from the page read", () => {
  it("diagnosis: a list item is not free text", () => {
    const base = { id: "d1", version: 3, label: "Pulpitis", toothFdi: 36, sortOrder: 1 };
    expect(diagFromPage({ ...base, listItemId: "l1" })).toMatchObject({
      key: "d1",
      version: 3,
      fromList: true,
    });
    expect(diagFromPage({ ...base, listItemId: null }).fromList).toBe(false);
  });

  it("procedure: surfaces from JSON, note empty text, no fee when the fee is missing or zero", () => {
    const base = {
      id: "p1",
      version: 1,
      listItemId: "l1",
      label: "RCT",
      toothFdi: 36,
      surfacesJson: '["o","m"]',
      note: null,
      moreSittings: true,
      sortOrder: 1,
    };
    expect(procFromPage({ ...base, defaultPaise: 5000 })).toMatchObject({
      surfaces: ["o", "m"],
      note: "",
      noFee: false,
      moreSittings: true,
    });
    expect(procFromPage({ ...base, defaultPaise: null }).noFee).toBe(true);
    expect(procFromPage({ ...base, defaultPaise: 0 }).noFee).toBe(true);
  });

  it("temp keys are unique", () => {
    expect(new Set([tempKey(), tempKey(), tempKey()]).size).toBe(3);
  });
});

describe("insertAt", () => {
  it("puts an item back in the same place and clamps the index", () => {
    expect(insertAt(["a", "c"], "b", 1)).toEqual(["a", "b", "c"]);
    expect(insertAt(["a"], "z", 9)).toEqual(["a", "z"]);
    expect(insertAt(["a"], "z", -3)).toEqual(["z", "a"]);
  });
});

describe("keyed queue", () => {
  it("runs the jobs of one key in order, even when an early one is slower", async () => {
    const enqueue = createKeyedQueue();
    const log: string[] = [];
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await Promise.all([
      enqueue("a", async () => {
        await wait(20);
        log.push("a1");
      }),
      enqueue("a", async () => {
        log.push("a2");
      }),
      enqueue("b", async () => {
        log.push("b1");
      }),
    ]);
    expect(log).toEqual(["b1", "a1", "a2"]);
  });

  it("a failed job does not stop the next one and still reports its own error", async () => {
    const enqueue = createKeyedQueue();
    const first = enqueue("a", () => Promise.reject(new Error("nope")));
    const second = enqueue("a", async () => "ok");
    await expect(first).rejects.toThrow("nope");
    await expect(second).resolves.toBe("ok");
  });
});
