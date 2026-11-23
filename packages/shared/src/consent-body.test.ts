import { describe, expect, it } from "vitest";
import { parseConsentBody } from "./consent-body";

describe("parseConsentBody", () => {
  it("reads headings, bullets, numbered items, tick boxes and paragraphs", () => {
    const blocks = parseConsentBody(
      ["# 1. First", "Some text.", "", "## A. Sub", "- one", "2. second", "[ ] PFM [ ] Other"].join(
        "\n",
      ),
    );
    expect(blocks).toEqual([
      { type: "heading", text: "1. First" },
      { type: "para", text: "Some text." },
      { type: "subheading", text: "A. Sub" },
      { type: "bullet", text: "one" },
      { type: "item", no: 2, text: "second" },
      { type: "para", text: "□ PFM □ Other" },
    ]);
  });

  it("a heading that starts with a number is a heading, not an item", () => {
    expect(parseConsentBody("# 3. Risks")[0]).toEqual({ type: "heading", text: "3. Risks" });
  });

  it("ignores blank lines", () => {
    expect(parseConsentBody("\n\n  \n")).toEqual([]);
  });
});
