import { useEffect, useState } from "react";

type Token = { name: string; use: string };

export const BRAND: Token[] = [
  { name: "blue", use: "Buttons, links, active" },
  { name: "navy", use: "Sidebar, headings" },
  { name: "blue-hover", use: "Hover" },
  { name: "blue-soft", use: "Selected rows, patient number" },
  { name: "focus", use: "Focus ring" },
  { name: "red", use: "Clinic name only" },
  { name: "teal", use: "Calendar colour coding only" },
];

export const NEUTRALS: Token[] = [
  { name: "bg", use: "Page background" },
  { name: "card", use: "Cards" },
  { name: "border", use: "Card and input borders" },
  { name: "text", use: "Text" },
  { name: "muted", use: "Secondary text" },
];

export const STATUS = ["success", "info", "warning", "danger", "neutral"] as const;

// Reads the live value from base.css, so the page always shows what the app uses.
function useTokenValue(name: string): string {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim());
  }, [name]);
  return value;
}

function Swatch({ name, use }: Token) {
  const value = useTokenValue(name);
  return (
    <li className="swatch">
      <span className="swatch-chip" style={{ background: `var(--${name})` }} />
      <span className="swatch-text">
        <code>--{name}</code>
        <span className="small muted">
          {value} · {use}
        </span>
      </span>
    </li>
  );
}

export function SwatchList({ tokens }: { tokens: Token[] }) {
  return (
    <ul className="swatches">
      {tokens.map((t) => (
        <Swatch key={t.name} {...t} />
      ))}
    </ul>
  );
}

export function StatusPairs() {
  return (
    <ul className="swatches">
      {STATUS.map((name) => (
        <li
          key={name}
          className="status-pair"
          style={{ color: `var(--${name}-text)`, background: `var(--${name}-bg)` }}
        >
          <code>--{name}-text</code> on <code>--{name}-bg</code>
        </li>
      ))}
    </ul>
  );
}
