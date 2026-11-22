import { defineConfig } from "vitest/config";

// Default node tests (FakeD1). Workers-runtime tests use vitest.workers.config.ts (1.7.2).
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/workers-int/**"],
  },
});
