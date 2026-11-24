import { defineConfig } from "vite";

const worker = "http://localhost:8787";
// The Worker's CSRF guard accepts only its own origin (APP_ORIGIN), so the dev proxy sends that.
const toWorker = { target: worker, headers: { origin: worker } };

// S3.1.2: libraries change rarely, the app code changes on every deploy. Own chunks keep them in
// the browser cache after a deploy. Matches the package folder, so e.g. "react-router" never lands
// in the react group by accident.
const pkg = (names: string[]) => new RegExp(`[\\/]node_modules[\\/](${names.join("|")})[\\/]`);

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": toWorker, "/hooks": toWorker },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rolldownOptions: {
      // S3.1.1: these feature index.ts files re-export their screens. The app imports small things from
      // those barrels (a panel, a function), which would drag the whole screen into the main
      // bundle and defeat React.lazy. Marking barrels side-effect free lets unused screens drop.
      treeshake: {
        moduleSideEffects: [
          { test: /[\/]packages[\/]shared[\/]src[\/]/, sideEffects: false },
          {
            test: /[\/]src[\/]features[\/](billing|messages|errors)[\/]index\.tsx?$/,
            sideEffects: false,
          },
        ],
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: pkg(["react", "react-dom", "scheduler", "react-router"]),
            },
            {
              name: "vendor-ui",
              test: /[\/]node_modules[\/](@radix-ui|@floating-ui|aria-hidden|react-remove-scroll[^\/]*|react-style-singleton|use-callback-ref|use-sidecar|get-nonce|tslib)[\/]/,
            },
            { name: "vendor-forms", test: pkg(["react-hook-form", "@hookform", "zod"]) },
          ],
        },
      },
    },
  },
});
