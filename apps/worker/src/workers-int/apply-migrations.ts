/// <reference types="@cloudflare/vitest-plugin/types" />
import { applyD1Migrations, type D1Migration } from "cloudflare:test";
import { env } from "cloudflare:workers";

type EnvWithMigrations = typeof env & { TEST_MIGRATIONS: D1Migration[] };

// Setup runs outside per-test isolation; applyD1Migrations skips already-applied rows.
await applyD1Migrations((env as EnvWithMigrations).DB, (env as EnvWithMigrations).TEST_MIGRATIONS);
