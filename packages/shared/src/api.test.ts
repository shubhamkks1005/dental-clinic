import { describe, expect, it } from "vitest";
import { fail, ok } from "./api";

describe("api reply shape", () => {
  it("ok wraps data", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
  });

  it("fail carries code and message", () => {
    expect(fail("not_found", "Not here.")).toEqual({
      ok: false,
      error: { code: "not_found", message: "Not here." },
    });
  });
});
