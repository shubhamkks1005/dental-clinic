import { describe, expect, it } from "vitest";
import { amountInWords } from "./amount-words";

describe("amountInWords (5.3.10)", () => {
  it("covers the plan examples", () => {
    expect(amountInWords(0)).toBe("Rupees zero only");
    expect(amountInWords(100)).toBe("Rupees one only");
    expect(amountInWords(9900)).toBe("Rupees ninety nine only");
    expect(amountInWords(100_00)).toBe("Rupees one hundred only");
    expect(amountInWords(1000_00)).toBe("Rupees one thousand only");
    expect(amountInWords(1_00_000_00)).toBe("Rupees one lakh only");
    expect(amountInWords(12_34_567_00)).toBe(
      "Rupees twelve lakh thirty four thousand five hundred sixty seven only",
    );
    expect(amountInWords(1_00_00_000_00)).toBe("Rupees one crore only");
  });
});
