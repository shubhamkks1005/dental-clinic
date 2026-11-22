import { describe, expect, it } from "vitest";
import { isSearchShortcut, type KeyInfo } from "./search-shortcut";

const key = (overrides: Partial<KeyInfo>): KeyInfo => ({
  key: "/",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: { tagName: "BODY" },
  ...overrides,
});

describe("search shortcut (1.4.3)", () => {
  it('"/" on the page jumps to search', () => {
    expect(isSearchShortcut(key({}))).toBe(true);
  });

  it("not while typing in a field, a text area, a select or editable text", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
      expect(isSearchShortcut(key({ target: { tagName } }))).toBe(false);
    }
    expect(isSearchShortcut(key({ target: { tagName: "DIV", isContentEditable: true } }))).toBe(
      false,
    );
  });

  it("not with Ctrl, Cmd or Alt, and not for other keys", () => {
    expect(isSearchShortcut(key({ ctrlKey: true }))).toBe(false);
    expect(isSearchShortcut(key({ metaKey: true }))).toBe(false);
    expect(isSearchShortcut(key({ altKey: true }))).toBe(false);
    expect(isSearchShortcut(key({ key: "?" }))).toBe(false);
  });
});
