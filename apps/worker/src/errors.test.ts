import { ConflictError, ForbiddenError, NotFoundError } from "@clinic/db";
import { describe, expect, it } from "vitest";
import { errorReply } from "./errors";

describe("errorReply", () => {
  it("an edit conflict is a 409 with the reload message (1.2.7)", () => {
    const { status, body } = errorReply(new ConflictError());
    expect(status).toBe(409);
    expect(body).toMatchObject({ ok: false, error: { code: "conflict" } });
    expect(body.ok === false && body.error.message).toMatch(/Reload/);
  });

  it("forbidden is 403 and not found is 404", () => {
    expect(errorReply(new ForbiddenError()).status).toBe(403);
    expect(errorReply(new NotFoundError("The patient")).status).toBe(404);
  });

  it("any other error is a generic 500 that hides the details", () => {
    const { status, body } = errorReply(new Error("SQLITE_ERROR near patients: Meena Joshi"));
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("Meena");
  });
});
