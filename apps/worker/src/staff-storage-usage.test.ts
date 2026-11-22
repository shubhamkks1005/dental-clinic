import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_WARN_BYTES, storageAlertLevel } from "@clinic/shared";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
});

describe("storage usage (3.7.6)", () => {
  it("sums files.bytes; 8 GB fake data is warn level", async () => {
    const eightGb = 8 * 1024 * 1024 * 1024;
    expect(storageAlertLevel(eightGb)).toBe("warn");
    expect(eightGb).toBeGreaterThan(STORAGE_WARN_BYTES);

    sqlite
      .prepare(
        `INSERT INTO files (id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256, original_filename)
         VALUES ('01M83FILEUSAGE00000000001', 'system', 'system', NULL, 'f/usage1', 'logo', 'image/png', ?, ?, 'logo.png')`,
      )
      .run(eightGb, "b".repeat(64));

    const cookie = await sessionCookie(env, "doc@example.test");
    const res = await app.request(
      `${ORIGIN}/api/staff/storage/usage`,
      { headers: { cookie } },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { bytes: number } };
    expect(body.data.bytes).toBe(eightGb);
    expect(storageAlertLevel(body.data.bytes)).toBe("warn");
  });
});
