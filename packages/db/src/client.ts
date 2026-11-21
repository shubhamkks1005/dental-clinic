import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type D1Binding = Parameters<typeof drizzle>[0];

export function createDb(d1: D1Binding) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof createDb>;
