import { describe, expect, it, vi } from "vitest";
import { createRequestScope, noRequestScope } from "./request-scope";

describe("request scope", () => {
  it("shared: two readers, one request", async () => {
    const scope = createRequestScope();
    const load = vi.fn(async () => [1, 2]);
    const [a, b] = await Promise.all([scope.shared("k", load), scope.shared("k", load)]);
    expect(a).toBe(b);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("shared: a failure is forgotten so the next read retries", async () => {
    const scope = createRequestScope();
    const load = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce("ok");
    await expect(scope.shared("k", load)).rejects.toThrow("down");
    await expect(scope.shared("k", load)).resolves.toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("prefetch: the first reader gets the running request, the next one asks again", async () => {
    const scope = createRequestScope();
    const load = vi.fn(async () => "data");
    scope.prefetch("p", load);
    scope.prefetch("p", load); // a second start (React strict mode) is ignored
    expect(load).toHaveBeenCalledTimes(1);
    await expect(scope.takeOr("p", load)).resolves.toBe("data");
    expect(load).toHaveBeenCalledTimes(1);
    await scope.takeOr("p", load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("prefetch: a failed request reaches the reader and is then forgotten", async () => {
    const scope = createRequestScope();
    scope.prefetch("p", () => Promise.reject(new Error("nope")));
    await expect(scope.takeOr("p", async () => "fresh")).rejects.toThrow("nope");
    await expect(scope.takeOr("p", async () => "fresh")).resolves.toBe("fresh");
  });

  it("prefetch: a failure nobody reads yet makes the reader ask again", async () => {
    const scope = createRequestScope();
    scope.prefetch("p", () => Promise.reject(new Error("nope")));
    await new Promise((r) => setTimeout(r, 0));
    await expect(scope.takeOr("p", async () => "fresh")).resolves.toBe("fresh");
  });

  it("a load that throws at once becomes a rejected promise", async () => {
    const scope = createRequestScope();
    await expect(
      scope.takeOr("x", () => {
        throw new Error("sync");
      }),
    ).rejects.toThrow("sync");
  });

  it("no scope: every call goes to the server", async () => {
    const load = vi.fn(async () => 1);
    await noRequestScope.shared("k", load);
    await noRequestScope.shared("k", load);
    noRequestScope.prefetch("k", load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
