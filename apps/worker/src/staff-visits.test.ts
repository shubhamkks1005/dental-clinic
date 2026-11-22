import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  addStaff(sqlite, { id: "dev-1", email: "dev@example.test", role: "developer" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Visit One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
});

async function staffJson(email: string, method: string, path: string, body?: unknown) {
  const cookie = await sessionCookie(env, email);
  if (method === "GET") {
    return app.request(`${ORIGIN}${path}`, { method, headers: { cookie } }, env);
  }
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}${path}`,
    {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: body === undefined ? "{}" : JSON.stringify(body),
    },
    env,
  );
}

describe("staff visit clinical API (3.2.7)", () => {
  it("doctor opens, reads, finalises and adds an addendum", async () => {
    const opened = await staffJson("doc@example.test", "POST", "/api/staff/visits", {
      patientId: "p1",
      visitDateLocal: "2026-11-22",
    });
    expect(opened.status).toBe(201);
    const openedBody = (await opened.json()) as {
      ok: true;
      data: { visit: { id: string; status: string; version: number } };
    };
    const visitId = openedBody.data.visit.id;
    expect(openedBody.data.visit.status).toBe("draft");

    const got = await staffJson("doc@example.test", "GET", `/api/staff/visits/${visitId}`);
    expect(got.status).toBe(200);

    const finalised = await staffJson(
      "doc@example.test",
      "POST",
      `/api/staff/visits/${visitId}/finalise`,
      { version: openedBody.data.visit.version },
    );
    expect(finalised.status).toBe(200);
    const finalBody = (await finalised.json()) as {
      ok: true;
      data: { visit: { status: string } };
    };
    expect(finalBody.data.visit.status).toBe("final");

    const addendum = await staffJson(
      "doc@example.test",
      "POST",
      `/api/staff/visits/${visitId}/addenda`,
      { body: "Fake correction note", reason: "Typo in advice" },
    );
    expect(addendum.status).toBe(201);
  });

  it("receptionist and developer get 403 on clinical visit routes", async () => {
    const openBody = { patientId: "p1", visitDateLocal: "2026-11-22" };
    expect(
      (await staffJson("rec@example.test", "POST", "/api/staff/visits", openBody)).status,
    ).toBe(403);
    expect(
      (await staffJson("dev@example.test", "POST", "/api/staff/visits", openBody)).status,
    ).toBe(403);

    const doctorOpen = await staffJson("doc@example.test", "POST", "/api/staff/visits", openBody);
    const visitId = (
      (await doctorOpen.json()) as { data: { visit: { id: string; version: number } } }
    ).data.visit.id;

    expect(
      (await staffJson("rec@example.test", "GET", `/api/staff/visits/${visitId}`)).status,
    ).toBe(403);
    expect(
      (await staffJson("rec@example.test", "GET", "/api/staff/patients/p1/visits")).status,
    ).toBe(403);
    expect(
      (
        await staffJson("rec@example.test", "POST", `/api/staff/visits/${visitId}/finalise`, {
          version: 1,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await staffJson("rec@example.test", "POST", `/api/staff/visits/${visitId}/addenda`, {
          body: "Nope",
          reason: "Nope",
        })
      ).status,
    ).toBe(403);
  });

  it("doctor lists recent visits for the side panel (3.5.2)", async () => {
    const opened = await staffJson("doc@example.test", "POST", "/api/staff/visits", {
      patientId: "p1",
      visitDateLocal: "2026-11-22",
    });
    expect(opened.status).toBe(201);
    const list = await staffJson(
      "doc@example.test",
      "GET",
      "/api/staff/patients/p1/visits?limit=3",
    );
    expect(list.status).toBe(200);
    const body = (await list.json()) as { ok: true; data: { visits: { id: string }[] } };
    expect(body.data.visits.length).toBe(1);
  });

  it("doctor patches notes and adds a diagnosis; receptionist cannot (3.5.3)", async () => {
    const opened = await staffJson("doc@example.test", "POST", "/api/staff/visits", {
      patientId: "p1",
      visitDateLocal: "2026-11-23",
    });
    const visitId = ((await opened.json()) as { data: { visit: { id: string; version: number } } })
      .data.visit.id;

    const patched = await staffJson("doc@example.test", "PATCH", `/api/staff/visits/${visitId}`, {
      version: 1,
      chiefComplaint: "Follow-up sensitivity",
      examNote: "36 occlusal",
      advice: "Desensitising paste",
      pulse: 70,
    });
    expect(patched.status).toBe(200);
    const patchBody = (await patched.json()) as {
      data: { visit: { chiefComplaint: string; version: number; diagnoses: unknown[] } };
    };
    expect(patchBody.data.visit.chiefComplaint).toBe("Follow-up sensitivity");
    expect(patchBody.data.visit.version).toBe(2);

    const dx = await staffJson(
      "doc@example.test",
      "POST",
      `/api/staff/visits/${visitId}/diagnoses`,
      { freeText: "Dentinal hypersensitivity", toothFdi: 36 },
    );
    expect(dx.status).toBe(201);

    const got = await staffJson("doc@example.test", "GET", `/api/staff/visits/${visitId}`);
    const gotBody = (await got.json()) as {
      data: { visit: { diagnoses: { label: string }[] } };
    };
    expect(gotBody.data.visit.diagnoses.map((d) => d.label)).toContain("Dentinal hypersensitivity");

    expect(
      (
        await staffJson("rec@example.test", "PATCH", `/api/staff/visits/${visitId}`, {
          version: 2,
          advice: "Nope",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await staffJson("rec@example.test", "POST", `/api/staff/visits/${visitId}/diagnoses`, {
          freeText: "Nope",
        })
      ).status,
    ).toBe(403);
  });

  it("doctor adds a procedure from the list; receptionist cannot (3.5.4)", async () => {
    const opened = await staffJson("doc@example.test", "POST", "/api/staff/visits", {
      patientId: "p1",
      visitDateLocal: "2026-11-24",
    });
    const visitId = ((await opened.json()) as { data: { visit: { id: string } } }).data.visit.id;

    const proc = await staffJson(
      "doc@example.test",
      "POST",
      `/api/staff/visits/${visitId}/procedures`,
      {
        listItemId: "01M83PROC02FILLING0000001",
        toothFdi: 46,
        surfaces: ["o", "m"],
        note: "Shade A2",
      },
    );
    expect(proc.status).toBe(201);
    const body = (await proc.json()) as {
      data: { procedure: { label: string; defaultPaise: number; surfaces: string[] } };
    };
    expect(body.data.procedure.label).toBe("Composite filling");
    expect(body.data.procedure.defaultPaise).toBe(200000);
    expect(body.data.procedure.surfaces).toEqual(["o", "m"]);

    const got = await staffJson("doc@example.test", "GET", `/api/staff/visits/${visitId}`);
    const gotBody = (await got.json()) as {
      data: { visit: { procedures: { label: string }[] } };
    };
    expect(gotBody.data.visit.procedures.map((p) => p.label)).toContain("Composite filling");

    expect(
      (
        await staffJson("rec@example.test", "POST", `/api/staff/visits/${visitId}/procedures`, {
          listItemId: "01M83PROC02FILLING0000001",
        })
      ).status,
    ).toBe(403);
  });

  it("bad open body is 400 for the doctor", async () => {
    expect(
      (await staffJson("doc@example.test", "POST", "/api/staff/visits", { patientId: "p1" }))
        .status,
    ).toBe(400);
  });

  it("doctor lists incomplete drafts; receptionist is 403 (3.5.8)", async () => {
    const opened = await staffJson("doc@example.test", "POST", "/api/staff/visits", {
      patientId: "p1",
      visitDateLocal: "2026-11-21",
    });
    expect(opened.status).toBe(201);
    const list = await staffJson("doc@example.test", "GET", "/api/staff/visits/drafts");
    expect(list.status).toBe(200);
    const body = (await list.json()) as {
      ok: true;
      data: { visits: { visitDateLocal: string; patientName: string }[] };
    };
    expect(body.data.visits).toHaveLength(1);
    expect(body.data.visits[0]).toMatchObject({
      visitDateLocal: "2026-11-21",
      patientName: "Fake Visit One",
    });
    expect((await staffJson("rec@example.test", "GET", "/api/staff/visits/drafts")).status).toBe(
      403,
    );
  });
});
