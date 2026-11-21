import type { Role } from "@clinic/shared";

// Who is acting, passed to every repository function.
// userId is a users.id, or 'system' for jobs and seeds. requestId ties log rows to one request.
export type Ctx = { userId: string; role: Role; requestId: string };
