import type { ListItem, ListItemData } from "./lists";

/** Where a chart condition may be placed (3.4.4). */
export const CONDITION_APPLIES = ["surface", "whole", "both"] as const;
export type ConditionApplies = (typeof CONDITION_APPLIES)[number];

export type ChartCondition = {
  code: string;
  label: string;
  color: string;
  icon: string;
  appliesTo: ConditionApplies;
};

function asApplies(raw: unknown): ConditionApplies {
  if (raw === "surface" || raw === "whole" || raw === "both") return raw;
  return "both";
}

/** Read chart fields from a conditions list item (DRAFT seeds until 3.1.1). */
export function chartConditionFromItem(item: {
  label: string;
  data: ListItemData;
  active?: boolean;
}): ChartCondition | null {
  const color = item.data.color;
  if (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color)) return null;
  const codeRaw = item.data.code;
  const code =
    typeof codeRaw === "string" && codeRaw.trim()
      ? codeRaw.trim().toLowerCase()
      : item.label.trim().toLowerCase().replace(/\s+/g, "_");
  if (!code) return null;
  const iconRaw = item.data.icon;
  const icon =
    typeof iconRaw === "string" && iconRaw.trim() ? iconRaw.trim() : code.slice(0, 2).toUpperCase();
  return {
    code,
    label: item.label.trim(),
    color: color.toUpperCase(),
    icon,
    appliesTo: asApplies(item.data.applies_to),
  };
}

export function chartConditionsFromList(items: readonly ListItem[]): ChartCondition[] {
  const out: ChartCondition[] = [];
  for (const item of items) {
    if (item.active === false) continue;
    const c = chartConditionFromItem(item);
    if (c) out.push(c);
  }
  return out;
}

export function conditionColorMap(conditions: readonly ChartCondition[]): Map<string, string> {
  return new Map(conditions.map((c) => [c.code, c.color]));
}

export function conditionAllowsSurface(condition: ChartCondition, surface: string): boolean {
  if (surface === "whole") return condition.appliesTo !== "surface";
  return condition.appliesTo !== "whole";
}
