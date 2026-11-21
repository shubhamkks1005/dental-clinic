const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

type RandomBytes = (length: number) => Uint8Array;

// 26 chars: 10 for the time (ms), 16 random. Sorts by creation time as text.
export function newUlid(now: number = Date.now(), randomBytes: RandomBytes = webRandom): string {
  return encodeTime(now) + encodeRandom(randomBytes(16));
}

function encodeTime(ms: number): string {
  let out = "";
  let rest = ms;
  for (let i = 0; i < 10; i++) {
    out = ALPHABET.charAt(rest % 32) + out;
    rest = Math.floor(rest / 32);
  }
  return out;
}

function encodeRandom(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < 16; i++) out += ALPHABET.charAt((bytes[i] ?? 0) % 32);
  return out;
}

// Web Crypto exists in Workers, browsers and Node; typed by hand because this
// package must not pull in DOM or Worker type libraries.
function webRandom(length: number): Uint8Array {
  const { crypto } = globalThis as unknown as {
    crypto: { getRandomValues(array: Uint8Array): Uint8Array };
  };
  return crypto.getRandomValues(new Uint8Array(length));
}
