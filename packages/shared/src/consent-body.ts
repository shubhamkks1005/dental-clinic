// Consent template text is plain text with a tiny markup, so the doctor can edit it in Settings:
//   "# Heading", "## Sub heading", "- bullet", "1. numbered item", "[ ]" = tick box, blank line
//   between paragraphs. Anything else is a paragraph.
export type ConsentBlock =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "bullet"; text: string }
  | { type: "item"; no: number; text: string }
  | { type: "para"; text: string };

const TICK_BOX = "□";

function tickBoxes(text: string): string {
  return text.replaceAll("[ ]", TICK_BOX);
}

export function parseConsentBody(body: string): ConsentBlock[] {
  const blocks: ConsentBlock[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const item = /^(\d{1,2})\.\s+(.*)$/.exec(line);
    if (line.startsWith("## ")) {
      blocks.push({ type: "subheading", text: tickBoxes(line.slice(3)) });
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "heading", text: tickBoxes(line.slice(2)) });
    } else if (line.startsWith("- ")) {
      blocks.push({ type: "bullet", text: tickBoxes(line.slice(2)) });
    } else if (item) {
      blocks.push({ type: "item", no: Number(item[1]), text: tickBoxes(item[2] ?? "") });
    } else {
      blocks.push({ type: "para", text: tickBoxes(line) });
    }
  }
  return blocks;
}
