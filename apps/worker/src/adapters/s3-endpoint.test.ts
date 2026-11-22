import { describe, expect, it } from "vitest";
import { normaliseS3Endpoint } from "./s3-endpoint";

describe("normaliseS3Endpoint", () => {
  it("adds https when the scheme is missing", () => {
    expect(normaliseS3Endpoint("s3.us-east-005.backblazeb2.com")).toBe(
      "https://s3.us-east-005.backblazeb2.com",
    );
  });

  it("keeps an existing https scheme and strips trailing slashes", () => {
    expect(normaliseS3Endpoint("https://s3.example.com/")).toBe("https://s3.example.com");
    expect(normaliseS3Endpoint("https://s3.example.com///")).toBe("https://s3.example.com");
  });

  it("keeps http if already present", () => {
    expect(normaliseS3Endpoint("http://localhost:9000")).toBe("http://localhost:9000");
  });

  it("returns empty trimmed input unchanged", () => {
    expect(normaliseS3Endpoint("  ")).toBe("");
  });
});
