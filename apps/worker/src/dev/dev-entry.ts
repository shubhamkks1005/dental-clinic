import { createWorker } from "../entry";
import { DEV_LOGIN_PATH, devLogin } from "./dev-login";

// Entry for local `wrangler dev` only (top-level "main" in wrangler.jsonc).
export default createWorker({
  extraPublic: [DEV_LOGIN_PATH],
  extend: (app) => app.get(DEV_LOGIN_PATH, devLogin),
});
