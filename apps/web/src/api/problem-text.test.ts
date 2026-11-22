import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import { OFFLINE_TEXT, problemText } from "./problem-text";

describe("error text for staff (1.4.7)", () => {
  it("a server failure shows the plain sentence and the Error ID", () => {
    const err = new ApiError(500, "server_error", "Something went wrong.", "8C2A1B3C");
    expect(problemText(err)).toBe("Something went wrong. Error ID: 8C2A1B3C.");
    expect(problemText(new ApiError(200, "bad_reply", "Unexpected reply.", "AB12CD34"))).toBe(
      "Unexpected reply. Error ID: AB12CD34.",
    );
  });

  it("input mistakes and refusals show only the sentence", () => {
    expect(problemText(new ApiError(400, "invalid", "Enter the person's name.", "X1"))).toBe(
      "Enter the person's name.",
    );
    expect(problemText(new ApiError(409, "conflict", "Reload and try again.", "X2"))).toBe(
      "Reload and try again.",
    );
  });

  it("no reply at all means no internet or no server", () => {
    expect(problemText(new TypeError("Failed to fetch"))).toBe(OFFLINE_TEXT);
  });
});
