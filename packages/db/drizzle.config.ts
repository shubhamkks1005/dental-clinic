import { defineConfig } from "drizzle-kit";

// Only generates SQL files; they are applied with `wrangler d1 migrations apply`.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/index.ts",
  out: "./migrations",
});
