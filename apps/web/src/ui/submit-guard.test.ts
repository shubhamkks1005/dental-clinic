import { describe, expect, it } from "vitest";
import { createSubmitGuard } from "./submit-guard";

describe("double-click guard (1.4.6)", () => {
  it("a second click while saving sends nothing", async () => {
    const once = createSubmitGuard();
    let sent = 0;
    const save = () =>
      new Promise<string>((resolve) => {
        sent += 1;
        setTimeout(() => resolve("saved"), 10);
      });
    const [first, second] = await Promise.all([once(save), once(save)]);
    expect(sent).toBe(1);
    expect(first).toBe("saved");
    expect(second).toBeUndefined();
  });

  it("after a save ends (also by error), the next click works again", async () => {
    const once = createSubmitGuard();
    await expect(once(() => Promise.reject(new Error("offline")))).rejects.toThrow("offline");
    expect(await once(() => Promise.resolve(2))).toBe(2);
  });
});
