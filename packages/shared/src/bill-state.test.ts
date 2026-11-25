import { describe, expect, it } from "vitest";
import { billStateWord, isReadyToBill } from "./bill-state";

describe("billStateWord", () => {
  it("not billed when there is no live bill, also after a cancel", () => {
    expect(billStateWord(null, 0)).toBe("not_billed");
    expect(billStateWord({ status: "cancelled", totalPaise: 5000 }, 0)).toBe("not_billed");
  });
  it("draft stays draft whatever was paid", () => {
    expect(billStateWord({ status: "draft", totalPaise: 5000 }, 0)).toBe("draft");
  });
  it("issued with a balance is with reception; fully paid is paid", () => {
    expect(billStateWord({ status: "issued", totalPaise: 5000 }, 0)).toBe("with_reception");
    expect(billStateWord({ status: "issued", totalPaise: 5000 }, 4999)).toBe("with_reception");
    expect(billStateWord({ status: "issued", totalPaise: 5000 }, 5000)).toBe("paid");
    expect(billStateWord({ status: "issued", totalPaise: 0 }, 0)).toBe("paid");
  });
  it("the desk list shows every state except paid", () => {
    expect(isReadyToBill("not_billed")).toBe(true);
    expect(isReadyToBill("draft")).toBe(true);
    expect(isReadyToBill("with_reception")).toBe(true);
    expect(isReadyToBill("paid")).toBe(false);
  });
});
