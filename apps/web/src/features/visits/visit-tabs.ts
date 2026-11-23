/** Visit screen tabs. The visit itself is one screen; Plan, History and Files stay beside it. */
export const VISIT_TAB_IDS = ["visit", "plan", "history", "files"] as const;
export type VisitTabId = (typeof VISIT_TAB_IDS)[number];

export const VISIT_TAB_LABEL: Record<VisitTabId, string> = {
  visit: "Visit",
  plan: "Plan",
  history: "History",
  files: "Files",
};

export function isVisitTabId(value: string): value is VisitTabId {
  return (VISIT_TAB_IDS as readonly string[]).includes(value);
}
