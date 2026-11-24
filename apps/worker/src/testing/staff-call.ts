import app from "../index";
import { ORIGIN, sameOriginPost, sessionCookie, type makeEnv } from "./app-env";

// Loose JSON for assertions in route tests.
export type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** One staff API call as a signed-in user (tests only): `staffCall(env, "doc@example.test", "POST", "/breaks", {...})`. */
export async function staffCall(
  env: ReturnType<typeof makeEnv>["env"],
  email: string,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
) {
  const cookie = await sessionCookie(env, email);
  const init = sameOriginPost(cookie);
  const res = await app.request(
    `${ORIGIN}/api/staff${path}`,
    {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    env,
  );
  return {
    status: res.status,
    json: (await res.json()) as { ok: boolean; data: Json; error: Json },
  };
}
