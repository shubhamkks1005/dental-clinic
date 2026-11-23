import { describe, expect, it, vi } from "vitest";
import { api } from "./client";

describe("api() body guard", () => {
  it("throws before any request when the body is already a JSON string", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(api("/api/staff/x", { method: "POST", body: '{"a":1}' })).rejects.toThrow(
      "plain object",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("sends a plain object as one JSON string", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      json: async () => ({ ok: true, data: { done: true } }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    await api("/api/staff/x", { method: "POST", body: { a: 1 } });
    expect(fetchSpy.mock.calls[0]?.[1]?.body).toBe('{"a":1}');
    vi.unstubAllGlobals();
  });
});
