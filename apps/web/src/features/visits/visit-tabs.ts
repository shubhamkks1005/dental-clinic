/** 3.5.2 / 4.2.2 visit screen tabs (S05). Labels match PLAN English UI. */
export const VISIT_TAB_IDS = ["today", "chart", "plan", "medicines", "history", "files"] as const;
export type VisitTabId = (typeof VISIT_TAB_IDS)[number];

export const VISIT_TAB_LABEL: Record<VisitTabId, string> = {
  today: "Today's visit",
  chart: "Chart",
  plan: "Plan",
  medicines: "Medicines",
  history: "History",
  files: "Files",
};

export function isVisitTabId(value: string): value is VisitTabId {
  return (VISIT_TAB_IDS as readonly string[]).includes(value);
}
