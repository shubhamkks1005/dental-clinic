import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p-del', 'system', 'system', 'P-000502', 'Fake Del Files', 'female', 33, '+919000000502', 'active')`,
    )
    .run();
});

describe("staff files soft delete API (3.7.7)", () => {
  it("deleted file leaves listing; audit has delete", async () => {
    const cookie = await sessionCookie(env, "doc@example.test");
    const form = new FormData();
    form.set("kind", "consent");
    form.set("file", new File([new Uint8Array([4, 5])], "c.pdf", { type: "application/pdf" }));
    const created = await app.request(
      `${ORIGIN}/api/staff/patients/p-del/files`,
      { ...sameOriginPost(cookie), body: form },
      env,
    );
    expect(created.status).toBe(201);
    const id = ((await created.json()) as { data: { file: { id: string } } }).data.file.id;

    const del = await app.request(
      `${ORIGIN}/api/staff/files/${id}`,
      { ...sameOriginPost(cookie), method: "DELETE", body: "{}" },
      env,
    );
    expect(del.status).toBe(200);

    const list = await app.request(
      `${ORIGIN}/api/staff/patients/p-del/files`,
      { headers: { cookie } },
      env,
    );
    const files = ((await list.json()) as { data: { files: { id: string }[] } }).data.files;
    expect(files.some((f) => f.id === id)).toBe(false);

    const audit = sqlite
      .prepare(`SELECT action FROM audit_log WHERE table_name = 'files' AND row_id = ?`)
      .all(id) as { action: string }[];
    expect(audit.some((a) => a.action === "delete")).toBe(true);
  });
});
