// Repository errors carry a stable code; the Worker turns them into { ok: false, error } replies.
export class RepoError extends Error {
  constructor(
    readonly code: "forbidden" | "not_found" | "conflict" | "not_allowed" | "invalid",
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

// Optimistic locking (1.2.7): the record's version changed since the user opened it.
export class ConflictError extends RepoError {
  constructor() {
    super(
      "conflict",
      "Someone else changed this record while you were editing. Reload to see the latest version, then make your change again.",
    );
  }
}

// The value itself is wrong (for example a setting outside its rule). The message says how to fix it.
export class InvalidError extends RepoError {
  constructor(message: string) {
    super("invalid", message);
  }
}

// A business rule refused the change (for example: the last active doctor). The message says why.
export class NotAllowedError extends RepoError {
  constructor(message: string) {
    super("not_allowed", message);
  }
}

export class NotFoundError extends RepoError {
  constructor(what: string) {
    super("not_found", `${what} was not found. It may have been removed.`);
  }
}
