import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSigner, nowSec } from "../testing/jwt-fixtures";
import { clearJwksCache, getJwks, verifyWithJwks } from "./jwks";

const URL_A = "https://keys.example/certs";
const claims = () => ({ iss: "i", aud: "a", exp: nowSec() + 60 });

function serveKeys(keys: object[], cacheControl = "public, max-age=3600") {
  const fetchMock = vi.fn(async () =>
    Response.json({ keys }, { headers: { "cache-control": cacheControl } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => clearJwksCache());
afterEach(() => vi.unstubAllGlobals());

describe("JWKS cache (1.3.2)", () => {
  it("fetches once and reuses the keys until max-age", async () => {
    const signer = await makeSigner();
    const fetchMock = serveKeys([signer.jwk]);
    const token = await signer.sign(claims());
    expect((await verifyWithJwks(token, URL_A)).ok).toBe(true);
    expect((await verifyWithJwks(token, URL_A)).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches when max-age has passed", async () => {
    const signer = await makeSigner();
    const fetchMock = serveKeys([signer.jwk], "max-age=60");
    await getJwks(URL_A, false, 0);
    await getJwks(URL_A, false, 61_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refetches once on an unknown key id (rotation), then accepts the new key", async () => {
    const oldSigner = await makeSigner("old");
    const newSigner = await makeSigner("new");
    const fetchMock = serveKeys([oldSigner.jwk]);
    await getJwks(URL_A, false, Date.now() - 10 * 60 * 1000);
    fetchMock.mockImplementation(async () => Response.json({ keys: [newSigner.jwk] }));
    expect((await verifyWithJwks(await newSigner.sign(claims()), URL_A)).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not refetch more than once per 5 minutes for unknown keys", async () => {
    const signer = await makeSigner("known");
    const stranger = await makeSigner("stranger");
    const fetchMock = serveKeys([signer.jwk]);
    const token = await stranger.sign(claims());
    expect(await verifyWithJwks(token, URL_A)).toEqual({ ok: false, reason: "unknown_kid" });
    expect(await verifyWithJwks(token, URL_A)).toEqual({ ok: false, reason: "unknown_kid" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
