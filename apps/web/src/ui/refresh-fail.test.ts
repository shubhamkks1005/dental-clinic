import { describe, expect, it } from "vitest";
import { REFRESH_FAILED_NOTE, refreshFailure } from "./refresh-fail";

describe("refreshFailure", () => {
  it("keeps the old data and shows the short note when data is on screen", () => {
    expect(refreshFailure(true, "Could not load today.")).toEqual({
      keepData: true,
      error: REFRESH_FAILED_NOTE,
    });
  });

  it("shows the real error when the first load fails", () => {
    expect(refreshFailure(false, "Could not load today.")).toEqual({
      keepData: false,
      error: "Could not load today.",
    });
  });
});
