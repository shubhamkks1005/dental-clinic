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
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Chart One', 'female', 30, '+919000000001', 'active')`,
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

describe("staff tooth chart API (3.4.5)", () => {
  it("doctor records three teeth then old as-of chart differs; receptionist is 403", async () => {
    const opened = await staffJson("doc@example.test", "POST", "/api/staff/visits", {
      patientId: "p1",
      visitDateLocal: "2026-01-10",
    });
    expect(opened.status).toBe(201);
    const visit = ((await opened.json()) as { data: { visit: { id: string; version: number } } })
      .data.visit;

    for (const [tooth, code] of [
      [16, "caries"],
      [26, "caries"],
      [36, "filling"],
    ] as const) {
      const res = await staffJson(
        "doc@example.test",
        "POST",
        "/api/staff/patients/p1/chart/events",
        {
          visitId: visit.id,
          toothFdi: tooth,
          surface: "o",
          conditionCode: code,
        },
      );
      expect(res.status).toBe(201);
    }

    const finalised = await staffJson(
      "doc@example.test",
      "POST",
      `/api/staff/visits/${visit.id}/finalise`,
      { version: visit.version },
    );
    expect(finalised.status).toBe(200);

    const draftOpen = await staffJson("doc@example.test", "POST", "/api/staff/visits", {
      patientId: "p1",
      visitDateLocal: "2026-11-23",
    });
    const draftId = ((await draftOpen.json()) as { data: { visit: { id: string } } }).data.visit.id;
    await staffJson("doc@example.test", "POST", "/api/staff/patients/p1/chart/events", {
      visitId: draftId,
      toothFdi: 16,
      surface: "o",
      conditionCode: "filling",
    });

    const current = await staffJson("doc@example.test", "GET", `/api/staff/patients/p1/chart`);
    expect(current.status).toBe(200);
    const currentBody = (await current.json()) as {
      data: { chart: { cells: { toothFdi: number; conditionCode: string }[] } };
    };
    expect(currentBody.data.chart.cells.find((c) => c.toothFdi === 16)?.conditionCode).toBe(
      "filling",
    );

    const old = await staffJson(
      "doc@example.test",
      "GET",
      `/api/staff/patients/p1/chart?asOfVisitId=${visit.id}`,
    );
    expect(old.status).toBe(200);
    const oldBody = (await old.json()) as {
      data: {
        chart: { cells: { toothFdi: number; conditionCode: string }[]; asOfVisitId: string };
      };
    };
    expect(oldBody.data.chart.asOfVisitId).toBe(visit.id);
    expect(oldBody.data.chart.cells.find((c) => c.toothFdi === 16)?.conditionCode).toBe("caries");

    expect(
      (await staffJson("rec@example.test", "GET", "/api/staff/patients/p1/chart")).status,
    ).toBe(403);
    expect(
      (
        await staffJson("rec@example.test", "POST", "/api/staff/patients/p1/chart/events", {
          visitId: draftId,
          toothFdi: 46,
          surface: "o",
          conditionCode: "filling",
        })
      ).status,
    ).toBe(403);
  });
});
