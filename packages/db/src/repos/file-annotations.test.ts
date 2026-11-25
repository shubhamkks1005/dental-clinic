import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const empty = { v: 1 as const, scale: null, items: [] };
const circle = { id: "c1", type: "circle" as const, cx: 100, cy: 100, r: 20 };

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 's', 's', 'P-009961', 'Fake Xray Patient', 'male', 40, '+919900099611', 'active')`,
    )
    .run();
  const file = (id: string, kind: string, mime: string) =>
    t.sqlite
      .prepare(
        `INSERT INTO files (id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256)
         VALUES (?, 's', 's', 'p1', ?, ?, ?, 10, ?)`,
      )
      .run(id, `key-${id}`, kind, mime, "a".repeat(64));
  file("xray", "iopa", "image/jpeg");
  file("scan1", "scan", "application/pdf");
});

const audits = () =>
  t.sqlite
    .prepare("SELECT before_json, after_json FROM audit_log WHERE table_name = 'files'")
    .all() as { before_json: string; after_json: string }[];

describe("x-ray annotations (B8)", () => {
  it("starts empty, saves with the file version, bumps it, and audits counts only", async () => {
    const first = await repos().fileAnnotations.get("xray");
    expect(first).toMatchObject({ annotations: null, version: 1 });

    const saved = await repos().fileAnnotations.save("xray", 1, {
      ...empty,
      scale: { mmPerUnit: 0.2, knownMm: 10, lineUnits: 50 },
      items: [circle],
    });
    expect(saved.version).toBe(2);
    expect((await repos().fileAnnotations.get("xray")).annotations?.items).toHaveLength(1);

    const rows = audits();
    expect(rows).toHaveLength(1);
    expect(JSON.parse(rows[0]!.after_json)).toEqual({
      annotations: { marks: 1, calibrated: true },
    });
    expect(rows[0]!.after_json).not.toContain("cx");
  });

  it("two tabs: the second save with the old version is a conflict and writes nothing", async () => {
    await repos().fileAnnotations.save("xray", 1, { ...empty, items: [circle] });
    await expect(repos().fileAnnotations.save("xray", 1, empty)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect((await repos().fileAnnotations.get("xray")).annotations?.items).toHaveLength(1);
    expect(audits()).toHaveLength(1);
  });

  it("refuses bad marks, a document scan, an unknown file and a receptionist", async () => {
    await expect(
      repos().fileAnnotations.save("xray", 1, {
        ...empty,
        items: [{ id: "x", type: "circle", cx: 999, cy: 1, r: 2 }],
      } as never),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(repos().fileAnnotations.save("scan1", 1, empty)).rejects.toBeInstanceOf(
      InvalidError,
    );
    await expect(repos().fileAnnotations.get("nope")).rejects.toBeInstanceOf(NotFoundError);
    await expect(repos(receptionist).fileAnnotations.get("xray")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(repos(receptionist).fileAnnotations.save("xray", 1, empty)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("the database itself refuses an annotations value that is not JSON or is over 64 KB", () => {
    const set = (v: string) =>
      t.sqlite.prepare("UPDATE files SET annotations_json = ? WHERE id = 'xray'").run(v);
    expect(() => set("not json")).toThrow();
    expect(() => set(JSON.stringify({ pad: "x".repeat(70_000) }))).toThrow();
    expect(() => set("{}")).not.toThrow();
  });
});
