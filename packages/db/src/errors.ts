// Repository errors carry a stable code; the Worker turns them into { ok: false, error } replies.
export class RepoError extends Error {
  constructor(
    readonly code: "forbidden" | "not_found",
    message: string,
  ) {
    super(message);
    this.name = "RepoError";
  }
}

export class ForbiddenError extends RepoError {
  constructor() {
    super("forbidden", "You do not have permission to do this. Ask the doctor if you need it.");
  }
}

export class NotFoundError extends RepoError {
  constructor(what: string) {
    super("not_found", `${what} was not found. It may have been removed.`);
  }
}
