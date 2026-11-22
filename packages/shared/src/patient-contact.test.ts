import { describe, expect, it } from "vitest";
import { contactMobile, contactRelationSaveError, defaultContactRelation } from "./patient-contact";

describe("patient contact (2.2.8)", () => {
  it("prefers own mobile over guardian", () => {
    expect(contactMobile({ mobile: "+919000000001", guardianMobile: "+919000000099" })).toBe(
      "+919000000001",
    );
    expect(contactMobile({ mobile: null, guardianMobile: "+919000000099" })).toBe("+919000000099");
  });

  it("requires relation when a contact mobile exists", () => {
    expect(
      contactRelationSaveError({
        mobile: "+919000000001",
        guardianMobile: null,
        contactRelation: null,
      }),
    ).toMatch(/whose mobile/i);
    expect(
      contactRelationSaveError({
        mobile: "+919000000001",
        guardianMobile: null,
        contactRelation: "self",
      }),
    ).toBeNull();
  });

  it("defaults relation from which number is present", () => {
    expect(defaultContactRelation({ mobile: "+919000000001", guardianMobile: null })).toBe("self");
    expect(defaultContactRelation({ mobile: null, guardianMobile: "+919000000099" })).toBe(
      "guardian",
    );
  });
});
