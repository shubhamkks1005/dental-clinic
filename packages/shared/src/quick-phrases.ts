/** 3.5.3: `;scal` expands to the doctor's quick_phrases list text. */

export type QuickPhrase = { trigger: string; text: string };

/**
 * If `value` ends with `;trigger` (optionally followed by a space the user just typed),
 * replace that token with the phrase text. Case-insensitive trigger match.
 */
export function expandQuickPhrase(
  value: string,
  phrases: QuickPhrase[],
): { value: string; expanded: boolean } {
  const spaced = value.match(/;([A-Za-z0-9_-]+) $/);
  const bare = spaced ? null : value.match(/;([A-Za-z0-9_-]+)$/);
  const match = spaced ?? bare;
  if (!match) return { value, expanded: false };
  const trigger = match[1]!.toLowerCase();
  const phrase = phrases.find((p) => p.trigger.toLowerCase() === trigger);
  if (!phrase) return { value, expanded: false };
  const start = value.length - match[0].length;
  const next = value.slice(0, start) + phrase.text + (spaced ? " " : "");
  return { value: next, expanded: true };
}
