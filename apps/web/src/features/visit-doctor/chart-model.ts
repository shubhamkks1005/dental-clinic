import type { ChartCell, ToothSurface } from "@clinic/shared";

// Rules of the chart accordion (design: chart controls, affected teeth, summary badge). Pure.

export type Mark = { toothFdi: number; surface: ToothSurface; conditionCode: string };

/** The chart as the doctor sees it before the marks are saved: each mark replaces its surface. */
export function withMarks(cells: ChartCell[], marks: Mark[]): ChartCell[] {
  const by = new Map(cells.map((c) => [`${c.toothFdi}:${c.surface}`, c]));
  for (const m of marks) {
    by.set(`${m.toothFdi}:${m.surface}`, {
      toothFdi: m.toothFdi,
      surface: m.surface,
      conditionCode: m.conditionCode,
      notedAt: "",
      eventId: `pending-${m.toothFdi}-${m.surface}`,
      changedToday: true,
    });
  }
  return [...by.values()].sort(
    (a, b) => a.toothFdi - b.toothFdi || a.surface.localeCompare(b.surface),
  );
}

export type Affected = {
  fdi: number;
  parts: { surface: ToothSurface; code: string; label: string }[];
};

/** Teeth with a finding, grouped, in tooth order ("Affected teeth & findings"). */
export function affectedTeeth(cells: ChartCell[], labelOf: (code: string) => string): Affected[] {
  const by = new Map<number, Affected>();
  for (const c of cells) {
    const row = by.get(c.toothFdi) ?? { fdi: c.toothFdi, parts: [] };
    row.parts.push({ surface: c.surface, code: c.conditionCode, label: labelOf(c.conditionCode) });
    by.set(c.toothFdi, row);
  }
  return [...by.values()].sort((a, b) => a.fdi - b.fdi);
}

/** The badge on the card title: "36 Deep cavity · 24 Filling", at most three teeth. */
export function chartBadge(list: Affected[]): string {
  const shown = list.slice(0, 3).map((t) => {
    const words = [...new Set(t.parts.map((p) => p.label))];
    return `${t.fdi} ${words.join(" ")}`;
  });
  return shown.join(" · ") + (list.length > 3 ? ` · +${list.length - 3}` : "");
}

/** "Saved 10:42 AM" / "Unsaved changes" / "Saving…" for the Save button area. */
export function chartSaveText(state: "saved" | "pending" | "saving", at: Date | null): string {
  if (state === "pending") return "Unsaved changes";
  if (state === "saving") return "Saving…";
  return at
    ? `Saved ${at.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
    : "Saved";
}
