// SQL for the developer-only staff commands (docs/AUTH_PLAN.md 4a, 4g). `wrangler d1 execute`
// cannot bind parameters, so every value is validated strictly and quoted here.
// Plain, erasable TypeScript only: staff-admin.mjs runs it with Node's built-in type stripping.

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const NAME = /^[\p{L} .'-]{2,80}$/u;
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function cleanEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  if (!EMAIL.test(email)) throw new Error("That does not look like an email address.");
  return email;
}

export function cleanName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!NAME.test(name))
    throw new Error("Use 2 to 80 letters, spaces, dots, apostrophes or hyphens.");
  return name;
}

function checked(pattern: RegExp, value: string, what: string): string {
  if (!pattern.test(value)) throw new Error(`Invalid ${what}`);
  return value;
}

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;

type Ids = { userId: string; auditId: string; accessId: string };

// Adds the doctor only if there is no active doctor yet. Audit and access rows follow only
// if the row before them was written (changes() > 0).
export function seedDoctorSql(input: Ids & { email: string; name: string }): string {
  const email = q(cleanEmail(input.email));
  const name = q(cleanName(input.name));
  const id = q(checked(ULID, input.userId, "user id"));
  return [
    `INSERT INTO users (id, email, name, role, status, created_by, updated_by) SELECT ${id}, ${email}, ${name}, 'doctor', 'active', 'system', 'system' WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'doctor' AND status = 'active' AND deleted_at IS NULL);`,
    `INSERT INTO audit_log (id, action, table_name, row_id, after_json, request_id, created_by, updated_by) SELECT ${q(checked(ULID, input.auditId, "audit id"))}, 'create', 'users', ${id}, json_object('email', ${email}, 'name', ${name}, 'role', 'doctor', 'how', 'seed-doctor command'), 'cli', 'system', 'system' WHERE changes() > 0;`,
    `INSERT INTO access_log (id, action, resource, resource_id, detail, request_id, created_by, updated_by) SELECT ${q(checked(ULID, input.accessId, "access id"))}, 'staff_change', 'users', ${id}, 'first doctor added by developer command', 'cli', 'system', 'system' WHERE changes() > 0;`,
  ].join("\n");
}

// Doctor lost her Gmail: new email, Google link cleared (next sign-in binds again), sessions ended.
export function recoverDoctorSql(
  input: Ids & { oldEmail: string; newEmail: string; nowIso: string },
): string {
  const oldEmail = q(cleanEmail(input.oldEmail));
  const newEmail = q(cleanEmail(input.newEmail));
  const now = q(checked(ISO, input.nowIso, "time"));
  return [
    `UPDATE users SET email = ${newEmail}, google_sub = NULL, version = version + 1, updated_at = ${now}, updated_by = 'system' WHERE email = ${oldEmail} AND role = 'doctor' AND deleted_at IS NULL;`,
    `INSERT INTO audit_log (id, action, table_name, row_id, before_json, after_json, request_id, created_by, updated_by) SELECT ${q(checked(ULID, input.auditId, "audit id"))}, 'update', 'users', id, json_object('email', ${oldEmail}), json_object('email', ${newEmail}, 'googleLink', 'cleared', 'how', 'recover-doctor command'), 'cli', 'system', 'system' FROM users WHERE email = ${newEmail} AND changes() > 0;`,
    `INSERT INTO access_log (id, action, resource, resource_id, detail, request_id, created_by, updated_by) SELECT ${q(checked(ULID, input.accessId, "access id"))}, 'staff_change', 'users', id, 'doctor email changed by developer recovery command', 'cli', 'system', 'system' FROM users WHERE email = ${newEmail} AND changes() > 0;`,
    `UPDATE staff_sessions SET revoked_at = ${now}, updated_at = ${now}, updated_by = 'system' WHERE revoked_at IS NULL AND user_id = (SELECT id FROM users WHERE email = ${newEmail});`,
  ].join("\n");
}
