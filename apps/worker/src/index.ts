import { createWorker } from "./entry";

// Staging and production entry (wrangler.jsonc env.*.main). No development code is imported here.
export default createWorker();
