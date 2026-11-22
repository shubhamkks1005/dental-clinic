/** 3.5.2 visit screen tabs (S05). Labels match PLAN English UI. */
export const VISIT_TAB_IDS = ["today", "chart", "plan", "history", "files"] as const;
export type VisitTabId = (typeof VISIT_TAB_IDS)[number];

export const VISIT_TAB_LABEL: Record<VisitTabId, string> = {
  today: "Today's visit",
  chart: "Chart",
  plan: "Plan",
  history: "History",
  files: "Files",
};

export function isVisitTabId(value: string): value is VisitTabId {
  return (VISIT_TAB_IDS as readonly string[]).includes(value);
}
