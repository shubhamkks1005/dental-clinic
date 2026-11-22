import { beforeAll, describe, expect, it } from "vitest";
import { makeSigner, nowSec, type TestSigner } from "../testing/jwt-fixtures";
import { checkStandardClaims, verifyRs256 } from "./jwt";

let signer: TestSigner;
beforeAll(async () => {
  signer = await makeSigner();
});

const rules = () => ({ issuers: ["https://issuer.example"], audience: "my-app", nowSec: nowSec() });
const goodClaims = () => ({
  iss: "https://issuer.example",
  aud: "my-app",
  exp: nowSec() + 300,
  iat: nowSec(),
});

describe("verifyRs256 (1.3.2)", () => {
  it("accepts a token signed by the named key", async () => {
    const result = await verifyRs256(await signer.sign(goodClaims()), [signer.jwk]);
    expect(result.ok).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const [h, , s] = (await signer.sign(goodClaims())).split(".");
    const forged = btoa(JSON.stringify({ ...goodClaims(), aud: "other" })).replace(/=+$/, "");
    expect(await verifyRs256(`${h}.${forged}.${s}`, [signer.jwk])).toEqual({
      ok: false,
      reason: "signature",
    });
  });

  it("rejects a key id it does not know", async () => {
    const other = await makeSigner("other-key");
    expect(await verifyRs256(await other.sign(goodClaims()), [signer.jwk])).toEqual({
      ok: false,
      reason: "unknown_kid",
    });
  });

  it("rejects any algorithm other than RS256", async () => {
    const token = await signer.sign(goodClaims(), { alg: "HS256", kid: "test-key-1" });
    expect(await verifyRs256(token, [signer.jwk])).toEqual({ ok: false, reason: "alg" });
  });

  it("rejects garbage", async () => {
    expect(await verifyRs256("not-a-jwt", [signer.jwk])).toEqual({
      ok: false,
      reason: "malformed",
    });
    expect(await verifyRs256("a.b.c", [signer.jwk])).toEqual({ ok: false, reason: "malformed" });
  });
});

describe("checkStandardClaims (1.3.2)", () => {
  it("passes good claims, including aud as an array", () => {
    expect(checkStandardClaims(goodClaims(), rules())).toBeNull();
    expect(checkStandardClaims({ ...goodClaims(), aud: ["x", "my-app"] }, rules())).toBeNull();
  });

  it("names the failing claim", () => {
    expect(checkStandardClaims({ ...goodClaims(), aud: "other" }, rules())).toBe("aud");
    expect(checkStandardClaims({ ...goodClaims(), iss: "https://evil.example" }, rules())).toBe(
      "iss",
    );
    expect(checkStandardClaims({ ...goodClaims(), exp: nowSec() - 120 }, rules())).toBe("exp");
    expect(checkStandardClaims({ ...goodClaims(), exp: undefined }, rules())).toBe("exp");
    expect(checkStandardClaims({ ...goodClaims(), iat: nowSec() + 600 }, rules())).toBe("iat");
  });

  it("allows 60 seconds of clock skew", () => {
    expect(checkStandardClaims({ ...goodClaims(), exp: nowSec() - 30 }, rules())).toBeNull();
  });
});
