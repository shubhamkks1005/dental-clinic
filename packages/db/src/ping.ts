import { sql } from "drizzle-orm";
import type { Db } from "./client";

/** Small read that proves D1 answers. Throws if the database is unreachable. */
export async function pingDb(db: Db): Promise<void> {
  await db.run(sql`SELECT 1`);
}
