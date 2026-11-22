import { describe, expect, it } from "vitest";
import { initials, shortName } from "./names";

describe("names on screen (1.3.7)", () => {
  it("short name keeps the Dr. title with the first name", () => {
    expect(shortName("Dr. Seed Test")).toBe("Dr. Seed");
    expect(shortName("dr Asha Rao")).toBe("dr Asha");
    expect(shortName("Meena Test")).toBe("Meena");
    expect(shortName("Meena")).toBe("Meena");
  });

  it("initials skip the title", () => {
    expect(initials("Dr. Seed Test")).toBe("ST");
    expect(initials("meena test")).toBe("MT");
    expect(initials("Meena")).toBe("M");
  });
});
