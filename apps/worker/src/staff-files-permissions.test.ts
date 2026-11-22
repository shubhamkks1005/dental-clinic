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
       VALUES ('p-fp', 'system', 'system', 'P-000401', 'Fake Perm Files', 'female', 28, '+919000000401', 'active')`,
    )
    .run();
});

async function upload(email: string, kind: string) {
  const cookie = await sessionCookie(env, email);
  const form = new FormData();
  form.set("kind", kind);
  form.set("file", new File([new Uint8Array([9, 8, 7])], `${kind}.jpg`, { type: "image/jpeg" }));
  const init = sameOriginPost(cookie);
  const res = await app.request(
    `${ORIGIN}/api/staff/patients/p-fp/files`,
    { ...init, body: form },
    env,
  );
  expect(res.status).toBe(201);
  const body = (await res.json()) as { data: { file: { id: string } } };
  return body.data.file.id;
}

describe("staff files permissions (3.7.5)", () => {
  it("receptionist gets 403 on X-ray content; scan OK; clinical view writes access_log", async () => {
    const xrayId = await upload("doc@example.test", "iopa");
    const scanId = await upload("doc@example.test", "scan");

    const recCookie = await sessionCookie(env, "rec@example.test");
    const xray = await app.request(
      `${ORIGIN}/api/staff/files/${xrayId}/content`,
      { headers: { cookie: recCookie } },
      env,
    );
    expect(xray.status).toBe(403);

    const scan = await app.request(
      `${ORIGIN}/api/staff/files/${scanId}/content`,
      { headers: { cookie: recCookie } },
      env,
    );
    expect(scan.status).toBe(200);

    const docCookie = await sessionCookie(env, "doc@example.test");
    const before = sqlite
      .prepare(`SELECT COUNT(*) AS n FROM access_log WHERE resource = 'file'`)
      .get() as {
      n: number;
    };
    const view = await app.request(
      `${ORIGIN}/api/staff/files/${xrayId}/content`,
      { headers: { cookie: docCookie } },
      env,
    );
    expect(view.status).toBe(200);
    const after = sqlite
      .prepare(`SELECT COUNT(*) AS n FROM access_log WHERE resource = 'file'`)
      .get() as {
      n: number;
    };
    expect(after.n).toBeGreaterThan(before.n);

    const list = await app.request(
      `${ORIGIN}/api/staff/patients/p-fp/files`,
      { headers: { cookie: recCookie } },
      env,
    );
    expect(list.status).toBe(200);
    const listed = (await list.json()) as { data: { files: { kind: string }[] } };
    expect(listed.data.files.every((f) => f.kind === "scan" || f.kind === "consent")).toBe(true);
    expect(listed.data.files.some((f) => f.kind === "iopa")).toBe(false);
  });

  it("receptionist cannot upload X-ray", async () => {
    const cookie = await sessionCookie(env, "rec@example.test");
    const form = new FormData();
    form.set("kind", "iopa");
    form.set("file", new File([new Uint8Array([1])], "x.jpg", { type: "image/jpeg" }));
    const init = sameOriginPost(cookie);
    const res = await app.request(
      `${ORIGIN}/api/staff/patients/p-fp/files`,
      { ...init, body: form },
      env,
    );
    expect(res.status).toBe(403);
  });
});
