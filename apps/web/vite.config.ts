import { defineConfig } from "vite";

const worker = "http://localhost:8787";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": worker, "/hooks": worker },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
