// Problem teeth of the prescription sheet (owner decision Q5: print the affected teeth with a
// short list, as PLAN U9.3). Built from this visit's diagnosis and procedure lines.

export type ProblemTooth = { fdi: number; items: string[] };

export function problemTeeth(lines: { label: string; toothFdi: number | null }[]): ProblemTooth[] {
  const by = new Map<number, string[]>();
  for (const l of lines) {
    if (l.toothFdi === null) continue;
    const list = by.get(l.toothFdi) ?? [];
    if (!list.includes(l.label)) list.push(l.label);
    by.set(l.toothFdi, list);
  }
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([fdi, items]) => ({ fdi, items }));
}

/** "Amoxicillin 500 mg" / "Brand (generic) strength": brand first when there is one. */
export function medicineTitle(m: { genericName: string; brand: string; strength: string }): string {
  const name = m.brand ? `${m.brand} (${m.genericName})` : m.genericName;
  return m.strength ? `${name} ${m.strength}` : name;
}

/** Tablets a course needs, roughly: the doses per day ("1-0-1" is 2) times the days. "" when unknown. */
export function totalApprox(frequency: string, days: string): string {
  const perDay = frequency
    .split("-")
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => a + b, 0);
  const d = Number.parseInt(days, 10);
  if (!perDay || !Number.isFinite(d)) return "";
  return String(perDay * d);
}

/** "5 days" as the design writes it on the sheet. */
export function daysWord(days: string): string {
  return /^\d+$/.test(days.trim()) ? `${days.trim()} days` : days;
}
