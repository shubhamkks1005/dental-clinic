import { describe, expect, it } from "vitest";
import { maskMobile, waLink } from "./messaging";

describe("waLink (7.3.2)", () => {
  it("builds digits-only 91 link with encoded text", () => {
    const link = waLink("+919876543210", "Namaste Meena");
    expect(link).toBe("https://wa.me/919876543210?text=Namaste%20Meena");
  });

  it("accepts spaced Indian mobile", () => {
    expect(waLink("98765 43210", "Hi")).toContain("919876543210");
  });

  it("rejects landline-like numbers", () => {
    expect(waLink("0123456789", "Hi")).toBeNull();
  });

  it("masks mobiles", () => {
    expect(maskMobile("+919876543210")).toBe("98••••10");
  });
});
