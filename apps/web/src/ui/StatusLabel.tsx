import { statusWord, type StatusKind } from "@clinic/shared";

// The one way to show a status: word from the shared map, colour pair from DESIGN.md.
// Cancelled is struck through, so colour is never the only signal.
export function StatusLabel({ kind, value }: { kind: StatusKind; value: string }) {
  const word = statusWord(kind, value);
  return (
    <span className={`badge badge-${word.tone}${word.struck ? " badge-struck" : ""}`}>
      {word.label}
    </span>
  );
}
