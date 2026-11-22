import { pageWindow, type Page, type PageQuery } from "@clinic/shared";

// FAKE rows for the style guide's data table demo: made-up names, no real patients.
export type SampleRow = { id: string; code: string; name: string; visits: number };

const FIRST = [
  "Aarav",
  "Diya",
  "Kabir",
  "Meera",
  "Rohan",
  "Sana",
  "Tara",
  "Vivaan",
  "Ishaan",
  "Anaya",
];
const LAST = ["Sharma", "Verma", "Gupta", "Nair", "Rao", "Khan", "Das", "Joshi", "Mehta", "Patel"];

export const SAMPLE_ROWS: SampleRow[] = Array.from({ length: 5000 }, (_, i) => ({
  id: `sample-${i + 1}`,
  code: `P-${String(i + 1).padStart(6, "0")}`,
  name: `${FIRST[i % 10]} ${LAST[(i * 7 + Math.floor(i / 10)) % 10]}`,
  visits: (i * 13) % 17,
}));

const SORTERS: Record<string, (a: SampleRow, b: SampleRow) => number> = {
  name: (a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code),
  code: (a, b) => a.code.localeCompare(b.code),
  visits: (a, b) => a.visits - b.visits || a.code.localeCompare(b.code),
};

// Stands in for a list endpoint: filter, sort, then one page, exactly as the server will.
export function samplePage(query: PageQuery): Page<SampleRow> {
  const q = query.q.toLowerCase();
  const matches = q
    ? SAMPLE_ROWS.filter(
        (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
      )
    : SAMPLE_ROWS;
  const compare = query.sort ? SORTERS[query.sort] : undefined;
  const sorted = compare
    ? [...matches].sort((a, b) => (query.dir === "asc" ? compare(a, b) : compare(b, a)))
    : matches;
  const { limit, offset } = pageWindow(query);
  return {
    rows: sorted.slice(offset, offset + limit),
    total: matches.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}
