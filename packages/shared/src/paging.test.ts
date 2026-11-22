import { describe, expect, it } from "vitest";
import { lastPage, pageQueryParams, pageWindow, parsePageQuery } from "./paging";

const reader = (values: Record<string, string>) => ({ get: (k: string) => values[k] ?? null });
const parse = (values: Record<string, string>) => parsePageQuery(reader(values), ["name", "code"]);

describe("server-side paging contract (1.4.5)", () => {
  it("defaults to page 1 of 25, no sort, no search", () => {
    expect(parse({})).toEqual({ page: 1, pageSize: 25, sort: null, dir: "asc", q: "" });
  });

  it("reads page, size, sort, direction and search", () => {
    expect(parse({ page: "3", pageSize: "50", sort: "code", dir: "desc", q: " Ravi " })).toEqual({
      page: 3,
      pageSize: 50,
      sort: "code",
      dir: "desc",
      q: "Ravi",
    });
  });

  it("ignores unknown sort columns, bad numbers, and caps size and search length", () => {
    expect(parse({ sort: "password", page: "-2", pageSize: "5000" })).toMatchObject({
      sort: null,
      page: 1,
      pageSize: 100,
    });
    expect(parse({ q: "x".repeat(300) }).q).toHaveLength(100);
    expect(parse({ page: "1.5", pageSize: "abc" })).toMatchObject({ page: 1, pageSize: 25 });
  });

  it("round-trips through URL parameters", () => {
    const query = parse({ page: "2", sort: "name", dir: "desc", q: "P-0004" });
    expect(parse(pageQueryParams(query))).toEqual(query);
  });

  it("gives LIMIT/OFFSET and the last page", () => {
    expect(pageWindow(parse({ page: "3", pageSize: "25" }))).toEqual({ limit: 25, offset: 50 });
    expect(lastPage(5000, 25)).toBe(200);
    expect(lastPage(0, 25)).toBe(1);
  });
});
