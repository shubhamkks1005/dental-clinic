import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const migrationsPath = path.join(root, "../../packages/db/migrations");

// 1.7.2: run a small suite inside the Workers runtime with real D1 schema (migrations applied).
export default defineConfig(async () => {
  const migrations = await readD1Migrations(migrationsPath);
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.vitest.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            AUTH_COOKIE_SECRET: "vitest-cookie-secret",
            GOOGLE_CLIENT_SECRET: "vitest-google-secret",
          },
        },
      }),
    ],
    test: {
      include: ["src/workers-int/**/*.test.ts"],
      setupFiles: ["./src/workers-int/apply-migrations.ts"],
      // One file at a time keeps CI minutes down for this suite.
      fileParallelism: false,
    },
  };
});
