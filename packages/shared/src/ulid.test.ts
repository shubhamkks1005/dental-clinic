import { describe, expect, it } from "vitest";
import { newUlid } from "./ulid";

const zeros = (n: number) => new Uint8Array(n);

describe("newUlid", () => {
  it("is 26 Crockford base32 characters", () => {
    expect(newUlid()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("encodes the time like the ULID spec example", () => {
    expect(newUlid(1469918176385, zeros).slice(0, 10)).toBe("01ARYZ6S41");
  });

  it("sorts by creation time as plain text", () => {
    expect(newUlid(1000, zeros) < newUlid(2000, zeros)).toBe(true);
  });

  it("gives different ids at the same millisecond", () => {
    expect(newUlid(5000)).not.toBe(newUlid(5000));
  });
});
