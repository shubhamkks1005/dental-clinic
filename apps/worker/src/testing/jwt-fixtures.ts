import type { Jwk } from "../domain/jwt";

// Test helpers: a throwaway RSA key and RS256 token signing, so JWT checks run with real crypto.
export type TestSigner = { jwk: Jwk; sign: (payload: object, header?: object) => Promise<string> };

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const jsonPart = (value: object) => base64Url(encoder.encode(JSON.stringify(value)));

export async function makeSigner(kid = "test-key-1"): Promise<TestSigner> {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const exported = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
  const jwk: Jwk = { ...exported, kid, alg: "RS256", use: "sig" };

  async function sign(payload: object, header: object = { alg: "RS256", kid }): Promise<string> {
    const signingInput = `${jsonPart(header)}.${jsonPart(payload)}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      pair.privateKey,
      encoder.encode(signingInput),
    );
    return `${signingInput}.${base64Url(new Uint8Array(signature as ArrayBuffer))}`;
  }

  return { jwk, sign };
}

export const nowSec = () => Math.floor(Date.now() / 1000);
