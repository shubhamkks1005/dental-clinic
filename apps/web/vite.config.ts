import { defineConfig } from "vite";

const worker = "http://localhost:8787";
// The Worker's CSRF guard accepts only its own origin (APP_ORIGIN), so the dev proxy sends that.
const toWorker = { target: worker, headers: { origin: worker } };

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": toWorker, "/hooks": toWorker },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
