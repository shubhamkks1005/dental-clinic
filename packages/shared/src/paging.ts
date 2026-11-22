// Server-side lists (1.4.5): the screen asks for one page; the API answers with that page and the
// total. Every list endpoint and the web data table use this one contract.
export const PAGE_SIZE_DEFAULT = 25;
export const PAGE_SIZE_MAX = 100;
const SEARCH_MAX = 100;

export type SortDir = "asc" | "desc";

export type PageQuery = {
  page: number;
  pageSize: number;
  sort: string | null;
  dir: SortDir;
  q: string;
};

export type Page<T> = { rows: T[]; total: number; page: number; pageSize: number };

export const firstPage = (sort: string | null = null): PageQuery => ({
  page: 1,
  pageSize: PAGE_SIZE_DEFAULT,
  sort,
  dir: "asc",
  q: "",
});

const wholeNumber = (raw: string | null | undefined, fallback: number) => {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

// Anything with get(name), e.g. URLSearchParams in the browser or the Worker.
export type ParamReader = { get(name: string): string | null };

// Reads ?page=&pageSize=&sort=&dir=&q= safely: unknown sort columns and silly sizes are ignored.
export function parsePageQuery(params: ParamReader, sortable: readonly string[]): PageQuery {
  const sort = params.get("sort");
  return {
    page: wholeNumber(params.get("page"), 1),
    pageSize: Math.min(wholeNumber(params.get("pageSize"), PAGE_SIZE_DEFAULT), PAGE_SIZE_MAX),
    sort: sort && sortable.includes(sort) ? sort : null,
    dir: params.get("dir") === "desc" ? "desc" : "asc",
    q: (params.get("q") ?? "").trim().slice(0, SEARCH_MAX),
  };
}

// The query as URL parameters (pass to new URLSearchParams(...) when calling an endpoint).
export function pageQueryParams(query: PageQuery): Record<string, string> {
  return {
    page: String(query.page),
    pageSize: String(query.pageSize),
    ...(query.sort ? { sort: query.sort } : {}),
    ...(query.dir === "desc" ? { dir: "desc" } : {}),
    ...(query.q ? { q: query.q } : {}),
  };
}

// For SQL: LIMIT and OFFSET of the requested page.
export function pageWindow(query: PageQuery): { limit: number; offset: number } {
  return { limit: query.pageSize, offset: (query.page - 1) * query.pageSize };
}

export const lastPage = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / pageSize));
