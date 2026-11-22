// "/" jumps to the patient search (1.4.3), unless the person is already typing somewhere.
export type KeyInfo = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  target: { tagName?: string; isContentEditable?: boolean } | null;
};

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function isSearchShortcut(e: KeyInfo): boolean {
  if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return false;
  const target = e.target;
  return !(target && (TYPING_TAGS.has(target.tagName ?? "") || target.isContentEditable));
}
