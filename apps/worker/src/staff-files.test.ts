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
       VALUES ('p-files', 'system', 'system', 'P-000301', 'Fake File One', 'female', 30, '+919000000301', 'active')`,
    )
    .run();
});

async function upload(
  email: string,
  kind: string,
  bytes: Uint8Array,
  name = "scan.jpg",
  mime = "image/jpeg",
) {
  const cookie = await sessionCookie(env, email);
  const form = new FormData();
  form.set("kind", kind);
  form.set("file", new File([bytes], name, { type: mime }));
  const init = sameOriginPost(cookie);
  return app.request(`${ORIGIN}/api/staff/patients/p-files/files`, { ...init, body: form }, env);
}

describe("staff files upload (3.7.2)", () => {
  it("unauthenticated content URL is 401", async () => {
    const res = await app.request(`${ORIGIN}/api/staff/files/any/content`, { method: "GET" }, env);
    expect(res.status).toBe(401);
  });

  it("doctor uploads scan; content returns bytes; cache private", async () => {
    const payload = new TextEncoder().encode("fake-scan-bytes");
    const created = await upload("doc@example.test", "scan", payload);
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      data: { file: { id: string; originalFilename: string; bytes: number } };
    };
    expect(body.data.file.originalFilename).toBe("scan.jpg");
    expect(body.data.file.bytes).toBe(payload.byteLength);

    const cookie = await sessionCookie(env, "doc@example.test");
    const content = await app.request(
      `${ORIGIN}/api/staff/files/${body.data.file.id}/content`,
      { headers: { cookie } },
      env,
    );
    expect(content.status).toBe(200);
    expect(content.headers.get("cache-control")).toBe("no-store");
    expect(await content.text()).toBe("fake-scan-bytes");
  });

  it("missing S3 config returns clean not_configured", async () => {
    const { env: env2, sqlite: sqlite2 } = makeEnv({
      STORAGE_DRIVER: "s3",
      S3_ENDPOINT: "",
      S3_BUCKET: "",
      S3_REGION: "",
      __testStorage: undefined,
    });
    addStaff(sqlite2, { id: "doc-a", email: "doc@example.test" });
    sqlite2
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES ('p-files', 'system', 'system', 'P-000301', 'Fake File One', 'female', 30, '+919000000301', 'active')`,
      )
      .run();

    const cookie = await sessionCookie(env2, "doc@example.test");
    const form = new FormData();
    form.set("kind", "scan");
    form.set("file", new File([new Uint8Array([1, 2, 3])], "a.jpg", { type: "image/jpeg" }));
    const init = sameOriginPost(cookie);
    const res = await app.request(
      `${ORIGIN}/api/staff/patients/p-files/files`,
      { ...init, body: form },
      env2,
    );
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: { message: string; code: string } };
    expect(json.error.code).toBe("not_configured");
    expect(json.error.message).toMatch(/not set up yet/i);
  });
});
