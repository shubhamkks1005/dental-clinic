type SubtleLike = { digest(algorithm: "SHA-256", data: Uint8Array): Promise<ArrayBuffer> };

/** SHA-256 hex for visit snapshots (3.2.6). Uses Web Crypto (Node 26 + Workers). */
export async function sha256Hex(text: string): Promise<string> {
  const g = globalThis as unknown as {
    TextEncoder: { new (): { encode(s: string): Uint8Array } };
    crypto: { subtle: SubtleLike };
  };
  const digest = await g.crypto.subtle.digest("SHA-256", new g.TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
