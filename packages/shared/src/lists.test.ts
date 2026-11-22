import { describe, expect, it } from "vitest";
import { isListKey, LIST_KEYS, listItemSchema } from "./lists";

describe("editable lists config (1.5.4)", () => {
  it("knows its lists; unknown or prototype keys are not lists", () => {
    expect(LIST_KEYS).toEqual(["visit_types", "referral_sources"]);
    expect(isListKey("visit_types")).toBe(true);
    expect(isListKey("toString")).toBe(false);
  });

  it("an item is a trimmed name plus the list's own fields", () => {
    expect(
      listItemSchema("visit_types").parse({ label: " Follow-up ", data: { minutes: 15 } }),
    ).toEqual({ label: "Follow-up", data: { minutes: 15 } });
    expect(listItemSchema("referral_sources").parse({ label: "Friend", data: {} })).toEqual({
      label: "Friend",
      data: {},
    });
  });

  it("refuses an empty name, a missing or out-of-range field, and unknown fields", () => {
    const visit = listItemSchema("visit_types");
    expect(visit.safeParse({ label: "", data: { minutes: 15 } }).error?.issues[0]?.message).toBe(
      "Enter a name.",
    );
    expect(visit.safeParse({ label: "X", data: {} }).error?.issues[0]?.message).toBe(
      "Enter the usual length.",
    );
    expect(visit.safeParse({ label: "X", data: { minutes: 500 } }).error?.issues[0]?.message).toBe(
      "Usual length: at most 240 minutes.",
    );
    expect(
      listItemSchema("referral_sources").safeParse({ label: "X", data: { price: 1 } }).success,
    ).toBe(false);
  });
});
