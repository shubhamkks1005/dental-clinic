import { describe, expect, it } from "vitest";
import { kindOf } from "./appointment-kinds";

describe("kindOf", () => {
  it("maps visit type words to a colour kind", () => {
    expect(kindOf("Consultation")).toBe("consult");
    expect(kindOf("Scaling and polishing")).toBe("clean");
    expect(kindOf("RCT 2")).toBe("rct");
    expect(kindOf("Extraction")).toBe("ext");
    expect(kindOf("Braces adjustment")).toBe("ortho");
    expect(kindOf("Pain, emergency")).toBe("emer");
    expect(kindOf("Something new")).toBe("consult");
  });
});
