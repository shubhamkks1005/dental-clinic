import { parseConsentBody, type ConsentBlock } from "@clinic/shared";
import type { ReactNode } from "react";

// Draws consent template text (markup: packages/shared/src/consent-body.ts).
// Consecutive bullets become one list, consecutive numbered items become one list.
export function ConsentBody({ body }: { body: string }) {
  const out: ReactNode[] = [];
  const blocks = parseConsentBody(body);
  for (let i = 0; i < blocks.length;) {
    const block = blocks[i]!;
    if (block.type === "bullet" || block.type === "item") {
      const kind = block.type;
      const run: ConsentBlock[] = [];
      while (i < blocks.length && blocks[i]!.type === kind) run.push(blocks[i++]!);
      out.push(
        kind === "bullet" ? (
          <ul key={i} className="consent-list">
            {run.map((b, n) => (
              <li key={n}>{"text" in b ? b.text : ""}</li>
            ))}
          </ul>
        ) : (
          <ol key={i} className="consent-list consent-numbered">
            {run.map((b, n) =>
              b.type === "item" ? (
                <li key={n} value={b.no}>
                  {b.text}
                </li>
              ) : null,
            )}
          </ol>
        ),
      );
      continue;
    }
    out.push(
      block.type === "heading" ? (
        <h3 key={i} className="consent-heading">
          {block.text}
        </h3>
      ) : block.type === "subheading" ? (
        <h4 key={i} className="consent-subheading">
          {block.text}
        </h4>
      ) : (
        <p key={i} className="consent-para">
          {block.text}
        </p>
      ),
    );
    i += 1;
  }
  return <div className="consent-body">{out}</div>;
}
