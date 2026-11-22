import type { GoogleClient } from "../domain/login";
import { verifyWithJwks } from "./jwks";

// Google endpoints (from https://accounts.google.com/.well-known/openid-configuration),
// written out to save a subrequest per sign-in.
const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

export function googleClient(clientId: string, clientSecret: string): GoogleClient {
  return {
    async exchangeCode({ code, verifier, redirectUri }) {
      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          code_verifier: verifier,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      if (!response.ok) throw new Error(`Google token endpoint returned HTTP ${response.status}`);
      const body = (await response.json()) as { id_token?: unknown };
      if (typeof body.id_token !== "string") throw new Error("Google sent no ID token");
      return body.id_token;
    },
    verifyIdToken: (idToken) => verifyWithJwks(idToken, GOOGLE_JWKS_URL),
  };
}
