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
    .replace("/print-log/preview", "/print-log/preview?kind=day_list&id=x")
    .replace("/bills/export", "/bills/export?month=2026-11")
    .replace(/:[^/]+/g, "x");
}

/** Bodies that pass the route's own parse so assertAllowed runs. */
function bodyFor(method: string, path: string): string | undefined {
  if (method === "GET") return undefined;
  if (path === "/api/staff/patient-requests") {
    return JSON.stringify({ patientId: "p-matrix", type: "copy", body: "Matrix request" });
  }
  if (path === "/api/staff/patient-requests/:id/close") {
    return JSON.stringify({ status: "done", note: "Matrix note", version: 1 });
  }
  if (path === "/api/staff/settings/:key") {
    return JSON.stringify({ value: "PT-", version: 1 });
  }
  if (path === "/api/staff/lists/:key") {
    return JSON.stringify({ label: "Matrix test source" });
  }
  if (path.includes("/lists/") && path.endsWith("/active")) {
    return JSON.stringify({ active: false, version: 1 });
  }
  if (path.includes("/lists/") && path.endsWith("/move-to")) {
    return JSON.stringify({ position: 1, version: 1 });
  }
  if (path.includes("/lists/medicines/") && path.endsWith("/hide")) {
    return JSON.stringify({ removeFromSets: false, version: 1 });
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
  if (path === "/api/staff/settings/:key/restore") {
    return JSON.stringify({ auditId: "01M86AUDITMATRIX00000001", version: 1 });
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
  if (path === "/api/staff/appointments/:id/undo-cancel" && method === "POST") {
    return JSON.stringify({ version: 1 });
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
  if (/\/appointments\/:id\/(skip|pull-forward|step-out|step-back|late)$/.test(path)) {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/breaks" && method === "POST") {
    return JSON.stringify({ minutes: 5, label: "Quick stretch" });
  }
  if (path === "/api/staff/breaks/:id/adjust") {
    return JSON.stringify({ deltaMinutes: 5, version: 1 });
  }
  if (path === "/api/staff/approvals" && method === "POST") {
    return JSON.stringify({ type: "refund", billId: "b-matrix", note: "Matrix ask" });
  }
  if (path === "/api/staff/approvals/:id/answer") {
    return JSON.stringify({ decision: "approve", version: 1 });
  }
  if (path === "/api/staff/approvals/:id/dismiss") {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/bills/:id/discount/reject") {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/breaks/:id/end") {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/patients/:id/medical-history" && method === "POST") {
    return JSON.stringify({
      items: [{ code: "diabetes", label: "Diabetes", answer: "no" }],
    });
  }
  if (path === "/api/staff/visits" && method === "POST") {
    return JSON.stringify({ patientId: "p1", visitDateLocal: "2026-11-22" });
  }
  if (path === "/api/staff/visits/:id" && method === "PATCH") {
    return JSON.stringify({ version: 1, chiefComplaint: "Matrix complaint" });
  }
  if (path === "/api/staff/visits/:id/diagnoses" && method === "POST") {
    return JSON.stringify({ freeText: "Matrix caries" });
  }
  if (path === "/api/staff/visits/:id/procedures" && method === "POST") {
    return JSON.stringify({ listItemId: "proc1", toothFdi: 46, surfaces: ["o"] });
  }
  if (/^\/api\/staff\/visits\/:id\/(diagnoses|procedures)\/:lineId(\/restore)?$/.test(path)) {
    return JSON.stringify(method === "PATCH" ? { version: 1, toothFdi: 36 } : { version: 1 });
  }
  if (path === "/api/staff/patients/:id/chart/events/batch") {
    return JSON.stringify({
      visitId: "v1",
      events: [{ toothFdi: 46, surface: "o", conditionCode: "filling" }],
    });
  }
  if (path === "/api/staff/files/:id/annotations" && method === "PUT") {
    return JSON.stringify({ version: 1, annotations: { v: 1, scale: null, items: [] } });
  }
  if (path === "/api/staff/patients/:id/teeth/:fdi/note") {
    return JSON.stringify({ visitId: "v1", body: "Matrix note" });
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
  if (path === "/api/staff/plan-items" && method === "POST") {
    return JSON.stringify({
      patientId: "p1",
      procedureLabel: "Matrix filling",
      estimatePaise: 10000,
      phase: 1,
      sittings: 1,
    });
  }
  if (path === "/api/staff/plan-items/:id/estimate" && method === "PATCH") {
    return JSON.stringify({ estimatePaise: 20000, reason: "Matrix reason", version: 1 });
  }
  if (path === "/api/staff/plan-items/:id/decision" && method === "PATCH") {
    return JSON.stringify({ status: "declined", version: 1 });
  }
  if (path === "/api/staff/prescriptions" && method === "POST") {
    return JSON.stringify({
      patientId: "p1",
      advice: "",
      dentistDispensed: false,
      dentistDispensedNote: "",
      items: [],
    });
  }
  if (path === "/api/staff/prescriptions/:id/items" && method === "PUT") {
    return JSON.stringify({ version: 1, items: [] });
  }
  if (path === "/api/staff/prescriptions/:id" && method === "PATCH") {
    return JSON.stringify({ version: 1, advice: "Matrix advice" });
  }
  if (path === "/api/staff/prescriptions/:id/issue" && method === "POST") {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/prescriptions/copy-previous" && method === "POST") {
    return JSON.stringify({ patientId: "p1" });
  }
  if (path === "/api/staff/print-log" && method === "POST") {
    return JSON.stringify({ documentKind: "day_list", documentId: "day-2026-11-23" });
  }
  if (path === "/api/staff/patients/:id/history/past-records" && method === "POST") {
    return JSON.stringify({
      recordedOn: "2020-01-15",
      body: "Matrix past paper note",
    });
  }
  if (path === "/api/staff/certificates" && method === "POST") {
    return JSON.stringify({
      patientId: "p1",
      patientName: "Fake Matrix Patient",
      patientAge: "30 yrs",
      patientAddress: "Test Area",
      identificationMark: "Mole",
      signMethod: "signature",
      reason: "Rest",
      fromOn: "2026-11-20",
      toOn: "2026-11-22",
    });
  }
  if (path === "/api/staff/certificates/:id" && method === "PATCH") {
    return JSON.stringify({ version: 1, reason: "Rest updated" });
  }
  if (path === "/api/staff/certificates/:id/finalise" && method === "POST") {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/bills" && method === "POST") {
    return JSON.stringify({
      patientId: "p1",
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Matrix item", qty: 1, unitPaise: 10000 }],
    });
  }
  if (path === "/api/staff/bills/:id" && method === "PATCH") {
    return JSON.stringify({
      version: 1,
      items: [{ procedureLabel: "Matrix item", qty: 1, unitPaise: 10000 }],
    });
  }
  if (path === "/api/staff/bills/:id/issue" && method === "POST") {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/bills/:id/note" && method === "PATCH") {
    return JSON.stringify({ version: 1, note: "Matrix note" });
  }
  if (path === "/api/staff/bills/:id/discount/apply" && method === "POST") {
    return JSON.stringify({ version: 1, discountPaise: 1000, reason: "courtesy" });
  }
  if (path === "/api/staff/bills/:id/discount" && method === "POST") {
    return JSON.stringify({ version: 1, discountPaise: 1000, reason: "courtesy" });
  }
  if (path === "/api/staff/bills/:id/discount/approve" && method === "POST") {
    return JSON.stringify({ version: 1 });
  }
  if (path === "/api/staff/bills/:id/cancel" && method === "POST") {
    return JSON.stringify({ version: 1, reason: "Matrix cancel" });
  }
  if (path === "/api/staff/payments" && method === "POST") {
    return JSON.stringify({
      patientId: "p1",
      amountPaise: 10000,
      mode: "cash",
      dayLocal: "2026-11-23",
    });
  }
  if (path === "/api/staff/refunds" && method === "POST") {
    return JSON.stringify({
      paymentId: "pay1",
      amountPaise: 1000,
      mode: "cash",
      reason: "Matrix refund",
    });
  }
  if (path === "/api/staff/patients/:id/dues-calls" && method === "POST") {
    return JSON.stringify({ note: "Fake matrix call note" });
  }
  if (path === "/api/staff/day-close" && method === "POST") {
    return JSON.stringify({
      dayLocal: "2026-11-23",
      cashCountedPaise: 0,
      note: "",
    });
  }
  if (path === "/api/staff/day-close/reopen" && method === "POST") {
    return JSON.stringify({ dayLocal: "2026-11-23", reason: "Matrix reopen" });
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
  if (path === "/api/staff/patients/:id/messages" && method === "POST") {
    return JSON.stringify({ templateKey: "recall" });
  }
  if (path === "/api/staff/appointments/:id/messages/send-now" && method === "POST") {
    return JSON.stringify({ kind: "confirm" });
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
