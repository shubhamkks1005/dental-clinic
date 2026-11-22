import { describe, expect, it } from "vitest";
import { startPageAfter401 } from "./session-end";

describe("session end (1.3.7)", () => {
  it("a timed-out staff page goes to the start page with the reason", () => {
    expect(startPageAfter401("/app/settings/staff", "session_timed_out")).toBe(
      "/?signed_out=timeout",
    );
  });

  it("any other 401 on a staff page goes to the plain start page", () => {
    expect(startPageAfter401("/app", "not_signed_in")).toBe("/");
  });

  it("the start page itself never redirects (no loop), nor does the portal", () => {
    expect(startPageAfter401("/", "session_timed_out")).toBeNull();
    expect(startPageAfter401("/my", "not_signed_in")).toBeNull();
    expect(startPageAfter401("/application", "not_signed_in")).toBeNull();
  });
});
