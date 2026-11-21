import type { Role } from "@clinic/shared";
import type { Ctx } from "./context";
import { ForbiddenError } from "./errors";

// The one permission table. Every repository function calls assertAllowed() first.
// Entries follow the plan's default role matrix; task 1.3.4 completes it (doctor confirms).
export const PERMISSIONS = {
  "settings.read": ["doctor", "receptionist", "developer"],
  "settings.write": ["doctor", "developer"],
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof PERMISSIONS;

export function isAllowed(role: Role, action: Action): boolean {
  return (PERMISSIONS[action] as readonly Role[]).includes(role);
}

export function assertAllowed(ctx: Ctx, action: Action): void {
  if (!isAllowed(ctx.role, action)) throw new ForbiddenError();
}
