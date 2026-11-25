import { istDate } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Line Api', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
});

async function call(email: string, method: string, path: string, body?: unknown) {
  const cookie = await sessionCookie(env, email);
  if (method === "GET")
    return app.request(`${ORIGIN}${path}`, { method, headers: { cookie } }, env);
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}${path}`,
    {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
    env,
  );
}

type Line = {
  id: string;
  version: number;
  toothFdi: number | null;
  surfaces: string[];
  note: string | null;
};
type Json = {
  data: {
    visit: { id: string; version: number; diagnoses: Line[] };
    diagnosis: Line;
    procedure: Line;
    version: number;
  };
};
const json = async (r: Response) => (await r.json()) as Json;

async function openVisit(visitDateLocal = "2026-11-25") {
  const r = await call("doc@example.test", "POST", "/api/staff/visits", {
    patientId: "p1",
    visitDateLocal,
  });
  return (await json(r)).data.visit.id as string;
}

describe("diagnosis and procedure line routes (B3)", () => {
  it("doctor changes the tooth, removes and undoes a diagnosis", async () => {
    const visitId = await openVisit();
    const base = `/api/staff/visits/${visitId}/diagnoses`;
    const added = await json(await call("doc@example.test", "POST", base, { freeText: "Caries" }));
    const line = added.data.diagnosis;

    const upd = await call("doc@example.test", "PATCH", `${base}/${line.id}`, {
      version: line.version,
      toothFdi: 36,
    });
    expect(upd.status).toBe(200);
    const updated = (await json(upd)).data.diagnosis;
    expect(updated).toMatchObject({ toothFdi: 36, version: line.version + 1 });

    const del = await call("doc@example.test", "DELETE", `${base}/${line.id}`, {
      version: updated.version,
    });
    expect(del.status).toBe(200);
    const gone = (await json(del)).data.version as number;
    const got = await json(await call("doc@example.test", "GET", `/api/staff/visits/${visitId}`));
    expect(got.data.visit.diagnoses).toHaveLength(0);

    const back = await call("doc@example.test", "POST", `${base}/${line.id}/restore`, {
      version: gone,
    });
    expect(back.status).toBe(200);
    const again = await json(await call("doc@example.test", "GET", `/api/staff/visits/${visitId}`));
    expect(again.data.visit.diagnoses).toHaveLength(1);
  });

  it("bad FDI is a 4xx on add and on update (test case 3)", async () => {
    const visitId = await openVisit();
    const base = `/api/staff/visits/${visitId}/diagnoses`;
    const bad = await call("doc@example.test", "POST", base, { freeText: "x", toothFdi: 19 });
    expect(bad.status).toBe(400);
    const added = await json(await call("doc@example.test", "POST", base, { freeText: "ok" }));
    const line = added.data.diagnosis;
    const bad2 = await call("doc@example.test", "PATCH", `${base}/${line.id}`, {
      version: line.version,
      toothFdi: 99,
    });
    expect(bad2.status).toBe(400);
  });

  it("procedure: tooth, surfaces, note, remove, undo; stale version is 409", async () => {
    const visitId = await openVisit();
    const base = `/api/staff/visits/${visitId}/procedures`;
    const added = await json(
      await call("doc@example.test", "POST", base, { listItemId: "01M83PROC02FILLING0000001" }),
    );
    const line = added.data.procedure;
    const upd = await json(
      await call("doc@example.test", "PATCH", `${base}/${line.id}`, {
        version: line.version,
        toothFdi: 46,
        surfaces: ["o", "d"],
        note: "A2",
      }),
    );
    expect(upd.data.procedure).toMatchObject({ toothFdi: 46, surfaces: ["o", "d"], note: "A2" });

    const stale = await call("doc@example.test", "PATCH", `${base}/${line.id}`, {
      version: line.version,
      note: "late",
    });
    expect(stale.status).toBe(409);

    const del = await json(
      await call("doc@example.test", "DELETE", `${base}/${line.id}`, {
        version: upd.data.procedure.version,
      }),
    );
    const back = await call("doc@example.test", "POST", `${base}/${line.id}/restore`, {
      version: del.data.version,
    });
    expect(back.status).toBe(200);
  });

  it("a line cannot be reached through another visit", async () => {
    const visitA = await openVisit();
    const line = (
      await json(
        await call("doc@example.test", "POST", `/api/staff/visits/${visitA}/diagnoses`, {
          freeText: "Mine",
        }),
      )
    ).data.diagnosis;
    sqlite
      .prepare(
        `INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status)
         VALUES ('v-other', 'system', 'system', 'p1', 'doc-a', '2026-11-24', 'draft')`,
      )
      .run();
    const r = await call(
      "doc@example.test",
      "DELETE",
      `/api/staff/visits/v-other/diagnoses/${line.id}`,
      { version: line.version },
    );
    expect(r.status).toBe(404);
  });

  it("receptionist gets 403 on every line route", async () => {
    const visitId = await openVisit();
    const dx = (
      await json(
        await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/diagnoses`, {
          freeText: "Caries",
        }),
      )
    ).data.diagnosis;
    const base = `/api/staff/visits/${visitId}/diagnoses/${dx.id}`;
    const body = { version: dx.version, toothFdi: 36 };
    const vBody = { version: dx.version };
    expect((await call("rec@example.test", "PATCH", base, body)).status).toBe(403);
    expect((await call("rec@example.test", "DELETE", base, vBody)).status).toBe(403);
    expect((await call("rec@example.test", "POST", `${base}/restore`, vBody)).status).toBe(403);
    const pbase = `/api/staff/visits/${visitId}/procedures/any`;
    expect((await call("rec@example.test", "PATCH", pbase, body)).status).toBe(403);
    expect((await call("rec@example.test", "DELETE", pbase, vBody)).status).toBe(403);
    expect((await call("rec@example.test", "POST", `${pbase}/restore`, vBody)).status).toBe(403);
  });

  it("finalised visit refuses edits and removal", async () => {
    const visitId = await openVisit();
    const line = (
      await json(
        await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/diagnoses`, {
          freeText: "Caries",
        }),
      )
    ).data.diagnosis;
    const got = await json(await call("doc@example.test", "GET", `/api/staff/visits/${visitId}`));
    await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/finalise`, {
      version: got.data.visit.version,
    });
    const r = await call(
      "doc@example.test",
      "DELETE",
      `/api/staff/visits/${visitId}/diagnoses/${line.id}`,
      { version: line.version },
    );
    expect(r.status).toBe(400);
  });
});

describe("visit page route (B5)", () => {
  it("doctor reads the whole page in one call; receptionist gets 403", async () => {
    const visitId = await openVisit();
    await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/diagnoses`, {
      freeText: "Caries",
    });
    const res = await call("doc@example.test", "GET", `/api/staff/visits/${visitId}/page`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        visit: { id: string; diagnoses: unknown[] };
        duesPaise: number;
        lastVisits: unknown[];
      };
    };
    expect(body.data.visit.id).toBe(visitId);
    expect(body.data.visit.diagnoses).toHaveLength(1);
    expect(body.data.duesPaise).toBe(0);
    expect(body.data.lastVisits).toEqual([]);
    expect(
      (await call("rec@example.test", "GET", `/api/staff/visits/${visitId}/page`)).status,
    ).toBe(403);
    expect((await call("doc@example.test", "GET", "/api/staff/visits/nope/page")).status).toBe(404);
  });
});

describe("tooth note route (B7)", () => {
  it("doctor saves, changes and clears a note; receptionist 403; bad tooth 400", async () => {
    const visitId = await openVisit();
    const url = "/api/staff/patients/p1/teeth/36/note";
    const saved = await call("doc@example.test", "PUT", url, { visitId, body: "Cold sensitivity" });
    expect(saved.status).toBe(200);
    const note = ((await saved.json()) as { data: { note: { version: number; body: string } } })
      .data.note;
    expect(note).toMatchObject({ body: "Cold sensitivity", version: 1 });

    const stale = await call("doc@example.test", "PUT", url, { visitId, body: "x" });
    expect(stale.status).toBe(409);
    const cleared = await call("doc@example.test", "PUT", url, {
      visitId,
      body: "",
      version: note.version,
    });
    expect(((await cleared.json()) as { data: { note: unknown } }).data.note).toBeNull();

    expect((await call("rec@example.test", "PUT", url, { visitId, body: "Nope" })).status).toBe(
      403,
    );
    expect(
      (
        await call("doc@example.test", "PUT", "/api/staff/patients/p1/teeth/19/note", {
          visitId,
          body: "x",
        })
      ).status,
    ).toBe(400);
  });
});

describe("x-ray annotation routes (B8)", () => {
  it("doctor reads and saves; receptionist 403; stale version 409; bad mark 400", async () => {
    sqlite
      .prepare(
        `INSERT INTO files (id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256)
         VALUES ('f-xr', 's', 's', 'p1', 'k-xr', 'iopa', 'image/jpeg', 10, ?)`,
      )
      .run("b".repeat(64));
    const url = "/api/staff/files/f-xr/annotations";
    const empty = { v: 1, scale: null, items: [] };
    const got = await call("doc@example.test", "GET", url);
    expect(((await got.json()) as { data: { version: number } }).data.version).toBe(1);

    const saved = await call("doc@example.test", "PUT", url, {
      version: 1,
      annotations: { ...empty, items: [{ id: "a", type: "arrow", x1: 1, y1: 1, x2: 9, y2: 9 }] },
    });
    expect(saved.status).toBe(200);
    expect(((await saved.json()) as { data: { version: number } }).data.version).toBe(2);

    expect(
      (await call("doc@example.test", "PUT", url, { version: 1, annotations: empty })).status,
    ).toBe(409);
    expect(
      (
        await call("doc@example.test", "PUT", url, {
          version: 2,
          annotations: { ...empty, items: [{ id: "a", type: "circle", cx: 500, cy: 1, r: 1 }] },
        })
      ).status,
    ).toBe(400);
    expect((await call("rec@example.test", "GET", url)).status).toBe(403);
    expect(
      (await call("rec@example.test", "PUT", url, { version: 2, annotations: empty })).status,
    ).toBe(403);
  });
});

describe("chart marks batch route (B9)", () => {
  it("doctor saves a group and gets the fresh chart; receptionist 403; bad mark 400", async () => {
    const visitId = await openVisit();
    const url = "/api/staff/patients/p1/chart/events/batch";
    const res = await call("doc@example.test", "POST", url, {
      visitId,
      events: [
        { toothFdi: 36, surface: "o", conditionCode: "caries" },
        { toothFdi: 36, surface: "o", conditionCode: "filling" },
      ],
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      data: { eventIds: string[]; chart: { cells: { toothFdi: number; conditionCode: string }[] } };
    };
    expect(body.data.eventIds).toHaveLength(2);
    expect(body.data.chart.cells).toEqual([
      expect.objectContaining({ toothFdi: 36, conditionCode: "filling" }),
    ]);

    expect(
      (
        await call("doc@example.test", "POST", url, {
          visitId,
          events: [{ toothFdi: 19, surface: "o", conditionCode: "caries" }],
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call("rec@example.test", "POST", url, {
          visitId,
          events: [{ toothFdi: 36, surface: "o", conditionCode: "caries" }],
        })
      ).status,
    ).toBe(403);
  });
});

describe("tooth history route (B10)", () => {
  it("doctor reads a tooth history with a cursor; receptionist 403; bad tooth 400", async () => {
    const visitId = await openVisit(istDate(new Date()));
    await call("doc@example.test", "POST", `/api/staff/visits/${visitId}/diagnoses`, {
      freeText: "Pulpitis",
      toothFdi: 36,
    });
    await call("doc@example.test", "POST", "/api/staff/patients/p1/chart/events", {
      visitId,
      toothFdi: 36,
      surface: "o",
      conditionCode: "caries",
    });
    const url = "/api/staff/patients/p1/teeth/36/history";
    const res = await call("doc@example.test", "GET", url);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        teeth: number[];
        entries: { kind: string; title: string; isToday: boolean }[];
        next: string | null;
      };
    };
    expect(body.data.teeth).toEqual([36]);
    expect(body.data.entries.map((e) => e.kind).sort()).toEqual(["chart", "diagnosis"]);
    expect(body.data.entries.every((e) => e.isToday)).toBe(true);
    expect(body.data.next).toBeNull();

    expect((await call("doc@example.test", "GET", `${url}?before=garbage`)).status).toBe(400);
    expect(
      (await call("doc@example.test", "GET", "/api/staff/patients/p1/teeth/19/history")).status,
    ).toBe(400);
    expect((await call("rec@example.test", "GET", url)).status).toBe(403);
  });
});
