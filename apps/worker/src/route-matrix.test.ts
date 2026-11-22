import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app";
import { matrixKey, rolesAllowed, rolesDenied, STAFF_ROUTE_MATRIX } from "./route-matrix";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

const app = createApp();
const staffRoutes = app.routes.filter((r) => r.method !== "ALL" && r.path.startsWith("/api/staff"));

const emailFor = {
  doctor: "doc-a@example.test",
  receptionist: "rec-1@example.test",
  developer: "dev-1@example.test",
} as const;

/** Fill path params so the request reaches the domain/repo (permission check). */
function concrete(path: string): string {
  return path
    .replace("/settings/:key", "/settings/patient_code.prefix")
    .replace("/lists/:key/:id", "/lists/referral_sources/id-1")
    .replace("/lists/:key", "/lists/referral_sources")
    .replace("/users/:id/", "/users/rec-1/")
    .replace(/:[^/]+/g, "x");
}

/** Bodies that pass the route's own parse so assertAllowed runs. */
function bodyFor(method: string, path: string): string | undefined {
  if (method === "GET") return undefined;
  if (path === "/api/staff/settings/:key") {
    return JSON.stringify({ value: "PT-", version: 1 });
  }
  if (path === "/api/staff/lists/:key") {
    return JSON.stringify({ label: "Matrix test source" });
  }
  if (path.includes("/lists/") && path.endsWith("/active")) {
    return JSON.stringify({ active: false, version: 1 });
  }
  if (path.includes("/lists/") && path.endsWith("/move")) {
    return JSON.stringify({ direction: "up", version: 1 });
  }
  if (path.includes("/lists/")) {
    return JSON.stringify({ label: "Matrix rename", version: 1 });
  }
  if (path === "/api/staff/users") {
    return JSON.stringify({
      name: "Matrix Person",
      email: "matrix-person@example.test",
      role: "receptionist",
    });
  }
  if (path === "/api/staff/patients" && method === "POST") {
    return JSON.stringify({
      fullName: "Matrix Create Fake",
      gender: "female",
      ageYearsAtReg: 30,
      mobile: "9000008888",
    });
  }
  if (path === "/api/staff/patients/:id" && method === "PUT") {
    return JSON.stringify({
      fullName: "Matrix Edit Fake",
      gender: "female",
      ageYearsAtReg: 30,
      mobile: "9000007777",
      version: 1,
    });
  }
  if (path === "/api/staff/patients/duplicate-check") {
    return JSON.stringify({ fullName: "Matrix Fake", mobile: "9000009999", ageYearsAtReg: 30 });
  }
  if (path.endsWith("/archive")) {
    return JSON.stringify({ reason: "Matrix archive reason", version: 1 });
  }
  if (path.endsWith("/restore")) {
    return JSON.stringify({ version: 1 });
  }
  if (path.endsWith("/consents") && method === "POST") {
    return JSON.stringify({
      type: "privacy_notice",
      noticeVersion: 1,
      given: true,
      method: "form",
    });
  }
  if (path === "/api/staff/appointments" && method === "POST") {
    return JSON.stringify({
      patientId: "p1",
      visitTypeId: "01M83VTYPE01CONSULT000001",
      dateLocal: "2026-11-23",
      startMin: 600,
      source: "phone",
    });
  }
  if (path === "/api/staff/appointments/walk-in" && method === "POST") {
    return JSON.stringify({
      patientId: "p1",
      visitTypeId: "01M83VTYPE01CONSULT000001",
    });
  }
  if (path === "/api/staff/appointments/:id/cancel" && method === "POST") {
    return JSON.stringify({ version: 1, reason: "patient_request" });
  }
  if (path === "/api/staff/appointments/:id/reschedule" && method === "POST") {
    return JSON.stringify({
      version: 1,
      dateLocal: "2026-11-24",
      startMin: 600,
    });
  }
  if (path === "/api/staff/appointments/:id/status" && method === "PATCH") {
    return JSON.stringify({ status: "confirmed", version: 1 });
  }
  if (path === "/api/staff/patients/:id/medical-history" && method === "POST") {
    return JSON.stringify({
      items: [{ code: "diabetes", label: "Diabetes", answer: "no" }],
    });
  }
  if (path === "/api/staff/visits" && method === "POST") {
    return JSON.stringify({ patientId: "p1", visitDateLocal: "2026-11-22" });
  }
  if (path === "/api/staff/visits/:id/finalise" && method === "POST") {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/visits/:id/addenda" && method === "POST") {
    return JSON.stringify({ body: "Matrix addendum", reason: "Matrix reason" });
  }
  if (path === "/api/staff/patients/:id/chart/events" && method === "POST") {
    return JSON.stringify({
      visitId: "v1",
      toothFdi: 46,
      surface: "o",
      conditionCode: "filling",
    });
  }
  if (path.endsWith("/role")) {
    return JSON.stringify({ role: "receptionist", version: 1 });
  }
  if (path.endsWith("/google-reset")) {
    return JSON.stringify({ email: "rec-1@example.test", version: 1 });
  }
  if (path.endsWith("/deactivate") || path.endsWith("/reactivate")) {
    return JSON.stringify({ version: 1 });
  }
  return "{}";
}

describe("staff route permission matrix (1.7.4)", () => {
  it("every registered staff route is in the matrix, and every matrix row is registered", () => {
    const registered = new Set(staffRoutes.map((r) => matrixKey(r.method, r.path)));
    const matrix = new Set(STAFF_ROUTE_MATRIX.map((e) => matrixKey(e.method, e.path)));
    expect([...registered].sort()).toEqual([...matrix].sort());
  });

  it("finds the staff routes (the walk is not empty)", () => {
    expect(staffRoutes.length).toBeGreaterThan(10);
  });
});

describe("role × permission endpoints (1.7.4)", () => {
  let env: ReturnType<typeof makeEnv>["env"];
  let sqlite: ReturnType<typeof makeEnv>["sqlite"];

  beforeEach(() => {
    ({ env, sqlite } = makeEnv());
    addStaff(sqlite, { id: "doc-a", email: emailFor.doctor });
    addStaff(sqlite, { id: "rec-1", email: emailFor.receptionist, role: "receptionist" });
    addStaff(sqlite, { id: "dev-1", email: emailFor.developer, role: "developer" });
  });

  async function cookie(role: keyof typeof emailFor) {
    return sessionCookie(env, emailFor[role]);
  }

  function call(method: string, path: string, cookieHeader?: string) {
    const body = bodyFor(method, path);
    if (method === "GET") {
      const headers: Record<string, string> = {};
      if (cookieHeader) headers.cookie = cookieHeader;
      return app.request(`${ORIGIN}${concrete(path)}`, { method, headers }, env);
    }
    const base = sameOriginPost(cookieHeader);
    return app.request(
      `${ORIGIN}${concrete(path)}`,
      {
        ...base,
        method,
        headers: {
          ...(base.headers as Record<string, string>),
          "content-type": "application/json",
        },
        body,
      },
      env,
    );
  }

  const permissionRows = STAFF_ROUTE_MATRIX.filter((e) => e.access.kind === "permission");

  it.each(
    permissionRows.map((e) => {
      if (e.access.kind !== "permission") throw new Error("expected permission");
      return [e.method, e.path, e.access.action] as const;
    }),
  )("%s %s: denied roles get 403; allowed roles do not", async (method, path, action) => {
    const denied = rolesDenied(action);
    const allowed = rolesAllowed(action);
    expect(allowed.length).toBeGreaterThan(0);

    for (const role of denied) {
      const res = await call(method, path, await cookie(role));
      expect(res.status, `${role} should be forbidden`).toBe(403);
    }
    for (const role of allowed) {
      const res = await call(method, path, await cookie(role));
      expect(res.status, `${role} should not be forbidden`).not.toBe(403);
      expect(res.status).not.toBe(401);
    }
  });

  it("GET /me answers for every role and stays 401 without a cookie", async () => {
    expect((await call("GET", "/api/staff/me")).status).toBe(401);
    for (const role of ["doctor", "receptionist", "developer"] as const) {
      const res = await call("GET", "/api/staff/me", await cookie(role));
      expect(res.status).toBe(200);
    }
  });

  it("POST logout answers for every role and stays 401 without a cookie", async () => {
    expect((await call("POST", "/api/staff/auth/logout")).status).toBe(401);
    for (const role of ["doctor", "receptionist", "developer"] as const) {
      const res = await call("POST", "/api/staff/auth/logout", await cookie(role));
      expect(res.status).toBe(200);
    }
  });
});
