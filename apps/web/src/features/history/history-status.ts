import { statusWord, type StatusWord } from "@clinic/shared";
import type { HistoryFeedEntry } from "./api";

const GOOD = new Set(["received", "given", "final"]);

// History rows carry the raw status of whatever they came from. This turns it into the shared
// words (PA-L03). A bill row has no paid amount here, so "issued" reads "Issued", not "Open".
export function historyStatusWord(type: HistoryFeedEntry["type"], status: string): StatusWord {
  if (type === "appointment" || type === "visit") return statusWord(type, status);
  if (type === "bill") {
    return status === "issued" ? { label: "Issued", tone: "upcoming" } : statusWord("bill", status);
  }
  // Unknown values come back capitalised and neutral, never as a raw code.
  const word = statusWord("appointment", status);
  return GOOD.has(status) ? { ...word, tone: "done" } : word;
}
