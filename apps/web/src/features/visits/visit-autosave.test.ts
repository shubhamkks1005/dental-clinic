import { describe, expect, it } from "vitest";
import { diffVisitNotes, saveStatusLabel, type NotesSnapshot } from "./visit-autosave";

const base: NotesSnapshot = {
  chiefComplaint: "",
  historyNote: "",
  examNote: "",
  gumCondition: "",
  advice: "",
  nextVisitNote: "",
  bpSystolic: "",
  bpDiastolic: "",
  pulse: "",
};

describe("diffVisitNotes (3.5.5)", () => {
  it("returns null when nothing changed", () => {
    expect(diffVisitNotes(1, base, base)).toBeNull();
  });

  it("includes only changed fields", () => {
    const patch = diffVisitNotes(3, { ...base, chiefComplaint: "Pain", pulse: "72" }, base);
    expect(patch).toEqual({
      version: 3,
      chiefComplaint: "Pain",
      pulse: 72,
    });
  });

  it("treats blank and empty as the same", () => {
    expect(diffVisitNotes(1, { ...base, advice: "  " }, { ...base, advice: "" })).toBeNull();
  });
});

describe("saveStatusLabel (3.5.5)", () => {
  it("labels each chip state", () => {
    expect(saveStatusLabel("saved")).toBe("Saved");
    expect(saveStatusLabel("error")).toBe("Not saved — retrying");
  });
});
