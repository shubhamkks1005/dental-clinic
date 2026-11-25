import type { ListItem } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import {
  doneStates,
  filterOptions,
  hasDuplicateProcedure,
  parseSurfaces,
  parseToothText,
  planTag,
  rupeesToPaise,
  searchOptions,
  summaryText,
  toggleSurface,
} from "./lines-model";

const item = (id: string, label: string, data: ListItem["data"] = {}, active = true): ListItem => ({
  id,
  label,
  data,
  active,
  sortOrder: 0,
  version: 1,
});

const procs = searchOptions(
  [
    item("p1", "RCT started", { default_paise: 250000, code: "RCT1" }),
    item("p2", "Composite filling", { default_paise: 120000, code: "COMP" }),
    item("p3", "Post-op check", { default_paise: 0, code: "CHK" }),
    item("p4", "Hidden one", { default_paise: 100, code: "HID" }, false),
  ],
  { "composite filling": 5, "rct started": 9 },
);

describe("search options", () => {
  it("leaves out hidden items and reads fee and code; zero fee means no fee set", () => {
    expect(procs.map((o) => o.id)).toEqual(["p1", "p2", "p3"]);
    expect(procs[2]).toMatchObject({ paise: null, code: "CHK" });
    expect(procs[0]).toMatchObject({ paise: 250000, uses: 9 });
  });

  it("an empty box shows the popular ones, most used first", () => {
    expect(filterOptions(procs, "").map((o) => o.id)).toEqual(["p1", "p2"]);
  });

  it("an empty box with nothing popular shows the start of the list", () => {
    const none = searchOptions([item("a", "A"), item("b", "B")], {});
    expect(filterOptions(none, "  ").map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("typing matches name or code, starts-with first, and caps at 8", () => {
    expect(filterOptions(procs, "comp").map((o) => o.id)).toEqual(["p2"]);
    expect(filterOptions(procs, "chk").map((o) => o.id)).toEqual(["p3"]);
    expect(filterOptions(procs, "o").map((o) => o.id)).toEqual(["p2", "p3"]);
    const many = searchOptions(
      Array.from({ length: 20 }, (_, i) => item(`x${i}`, `Scale ${i}`)),
      {},
    );
    expect(filterOptions(many, "scale")).toHaveLength(8);
    expect(filterOptions(procs, "zzz")).toEqual([]);
  });
});

describe("tooth text", () => {
  it("accepts FDI numbers and empty, refuses the rest", () => {
    expect(parseToothText("36")).toEqual({ ok: true, fdi: 36 });
    expect(parseToothText(" 85 ")).toEqual({ ok: true, fdi: 85 });
    expect(parseToothText("")).toEqual({ ok: true, fdi: null });
    for (const bad of ["19", "99", "3", "036", "ab", "36.5", "56"]) {
      expect(parseToothText(bad), bad).toEqual({ ok: false });
    }
  });
});

describe("surfaces", () => {
  it("reads the saved JSON and toggles one surface at a time", () => {
    expect(parseSurfaces('["o","d","zz"]')).toEqual(["o", "d"]);
    expect(parseSurfaces("not json")).toEqual([]);
    expect(toggleSurface(["o"], "m")).toEqual(["o", "m"]);
    expect(toggleSurface(["o", "m"], "o")).toEqual(["m"]);
  });
});

describe("duplicate and plan tag", () => {
  it("the same name on the same tooth twice is a duplicate; a line without a tooth never is", () => {
    expect(
      hasDuplicateProcedure([
        { label: "Filling", toothFdi: 36 },
        { label: "filling", toothFdi: 36 },
      ]),
    ).toBe(true);
    expect(
      hasDuplicateProcedure([
        { label: "Filling", toothFdi: 36 },
        { label: "Filling", toothFdi: 24 },
        { label: "Filling", toothFdi: null },
        { label: "Filling", toothFdi: null },
      ]),
    ).toBe(false);
  });

  const plan = [
    {
      id: "a",
      toothFdi: 36,
      procedureLabel: "RCT started",
      status: "in_progress",
      sittings: 3,
      sittingsDone: 1,
    },
    {
      id: "b",
      toothFdi: 24,
      procedureLabel: "Crown",
      status: "planned",
      sittings: 1,
      sittingsDone: 0,
    },
  ];
  it("tags a line that matches an open plan item by tooth and name", () => {
    expect(planTag({ label: "rct started", toothFdi: 36 }, plan)).toBe(
      "From plan: RCT started sitting 2 of 3",
    );
    expect(planTag({ label: "Crown", toothFdi: 24 }, plan)).toBe("From plan: Crown");
    expect(planTag({ label: "Crown", toothFdi: 36 }, plan)).toBeNull();
    expect(planTag({ label: "Crown", toothFdi: null }, plan)).toBeNull();
  });
});

describe("summary, done and fee text", () => {
  it("counts only, with the right plural", () => {
    expect(summaryText(1, 2)).toBe("1 diagnosis · 2 procedures");
    expect(summaryText(0, 1)).toBe("0 diagnoses · 1 procedure");
  });
  it("done = a line or the none choice", () => {
    expect(
      doneStates({ diagnoses: 0, procedures: 0, noDiagnosis: false, noProcedure: false }),
    ).toEqual({ diagnosis: false, procedure: false });
    expect(
      doneStates({ diagnoses: 0, procedures: 1, noDiagnosis: true, noProcedure: false }),
    ).toEqual({ diagnosis: true, procedure: true });
  });
  it("rupees to paise", () => {
    expect(rupeesToPaise("1200")).toBe(120000);
    expect(rupeesToPaise("99.5")).toBe(9950);
    for (const bad of ["", "0", "-5", "abc", "1.234", "100000000"]) {
      expect(rupeesToPaise(bad), bad).toBeNull();
    }
  });
});
