import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// T2.1: every text colour used on the doctor's Today reaches WCAG AA (4.5:1) on its background.
// Values are read from doctor-tokens.css so the test follows any token change.
const css = readFileSync(fileURLToPath(new URL("./doctor-tokens.css", import.meta.url)), "utf8");
const tokens = Object.fromEntries(
  [...css.matchAll(/--td-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]),
);
const color = (name: string) => {
  const value = name === "white" ? "#ffffff" : tokens[name];
  if (!value) throw new Error(`Token --td-${name} is missing from doctor-tokens.css`);
  return value;
};

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

// [text, background]
const PAIRS: [string, string][] = [
  ["text", "card"],
  ["text", "surface"],
  ["muted", "card"],
  ["muted", "low"],
  ["muted", "container"],
  ["info-text", "info-bg"],
  ["warning-text", "warning-bg"],
  ["success-text", "success-bg"],
  ["error-text", "error-bg"],
  ["on-primary", "primary"],
  ["on-primary", "primary-hover"],
  ["on-primary-soft", "primary-hover"],
  ["primary", "card"],
  ["warning", "card"],
  ["info", "card"],
  ["success", "card"],
  ["white", "error"],
  ["text", "secondary-bg"],
];

describe("doctor Today colours (T2.1)", () => {
  it.each(PAIRS)("%s on %s reaches 4.5:1", (text, bg) => {
    expect(contrast(color(text), color(bg))).toBeGreaterThanOrEqual(4.5);
  });
});
