import { describe, expect, it } from "vitest";
import { SETTING_SCHEMAS } from "./settings";
import { TUNABLE_KEYS, TUNABLES } from "./tunables";

describe("tunables (6.5.3)", () => {
  it("every tunable is a setting whose default passes and out-of-range fails", () => {
    for (const key of TUNABLE_KEYS) {
      expect(Object.hasOwn(SETTING_SCHEMAS, key), key).toBe(true);
      const t = TUNABLES[key];
      const schema = SETTING_SCHEMAS[key as keyof typeof SETTING_SCHEMAS];
      expect(schema.safeParse(t.default).success, key).toBe(true);
      expect(schema.safeParse(t.min - 1).success, key).toBe(false);
      expect(schema.safeParse(t.max + 1).success, key).toBe(false);
    }
  });
});
