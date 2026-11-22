import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// 1.4.1: every text colour on the background it is used on reaches WCAG AA (4.5:1).
// Values are read from base.css, so the test follows any token change. (Vitest stubs CSS
// imports, so the file is read from disk.)
const baseCss = readFileSync(new URL("./base.css", import.meta.url).pathname, "utf8");
const tokens = Object.fromEntries(
  [...baseCss.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]),
);
const WHITE = "#ffffff";

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const color = (name: string) => {
  const value = name === "white" ? WHITE : tokens[name];
  if (!value) throw new Error(`Token --${name} is missing from base.css`);
  return value;
};

// [text, background]: the pairs the screens use.
const PAIRS: [string, string][] = [
  ["text", "bg"],
  ["text", "card"],
  ["muted", "card"],
  ["muted", "bg"],
  ["blue", "card"],
  ["navy", "card"],
  ["red", "card"],
  ["blue-hover", "blue-soft"],
  ["white", "blue"],
  ["white", "blue-hover"],
  ["white", "navy"],
  ["on-navy", "navy"],
  ["on-navy-muted", "navy"],
  ["success-text", "success-bg"],
  ["info-text", "info-bg"],
  ["warning-text", "warning-bg"],
  ["danger-text", "danger-bg"],
  ["neutral-text", "neutral-bg"],
  ["danger-text", "card"],
  ["white", "teal"],
];

describe("colour contrast (1.4.1)", () => {
  it("reads the DESIGN.md tokens from base.css", () => {
    expect(tokens.blue).toBe("#1e4fa3");
    expect(Object.keys(tokens).length).toBeGreaterThan(20);
  });

  it.each(PAIRS)("%s on %s is at least 4.5:1", (text, background) => {
    expect(contrast(color(text), color(background))).toBeGreaterThanOrEqual(4.5);
  });
});
