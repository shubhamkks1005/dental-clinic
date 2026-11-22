import { describe, expect, it } from "vitest";
import { expandQuickPhrase } from "./quick-phrases";

const phrases = [
  { trigger: "scal", text: "Scaling and polishing completed." },
  { trigger: "review", text: "Reviewed. Soft tissues healthy." },
];

describe("expandQuickPhrase (3.5.3)", () => {
  it("expands ;scal at the end", () => {
    const r = expandQuickPhrase("Note ;scal", phrases);
    expect(r.expanded).toBe(true);
    expect(r.value).toBe("Note Scaling and polishing completed.");
  });

  it("expands when a space follows the trigger", () => {
    const r = expandQuickPhrase("Note ;scal ", phrases);
    expect(r.expanded).toBe(true);
    expect(r.value).toBe("Note Scaling and polishing completed. ");
  });

  it("leaves unknown triggers alone", () => {
    const r = expandQuickPhrase("Hello ;xyz", phrases);
    expect(r.expanded).toBe(false);
    expect(r.value).toBe("Hello ;xyz");
  });
});
