import { describe, expect, it } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

describe("crash page (1.4.7)", () => {
  it("a crash gets a fresh 8-character Error ID", () => {
    const a = ErrorBoundary.getDerivedStateFromError().errorId;
    const b = ErrorBoundary.getDerivedStateFromError().errorId;
    expect(a).toMatch(/^[0-9A-F]{8}$/);
    expect(a).not.toBe(b);
  });
});
