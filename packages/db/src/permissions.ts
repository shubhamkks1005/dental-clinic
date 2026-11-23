import type { Role } from "@clinic/shared";
import type { Ctx } from "./context";
import { ForbiddenError } from "./errors";

// The one permission table (task 1.3.4; docs/AUTH_PLAN.md 4f). Access comes only from the role.
// Every repository function calls assertAllowed() first.
// TO BE CONFIRMED BY THE DOCTOR before task 1.3.4 is closed (DECISIONS.md).
// Developer = support only: configuration, never patient data.
export const PERMISSIONS = {
  "patients.view": ["doctor", "receptionist"],
  "patients.edit": ["doctor", "receptionist"],
  "patients.delete": ["doctor"],
  "clinical.view": ["doctor"],
  "clinical.edit": ["doctor"],
  // Receptionist sees only that an alert exists ("Doctor to check"), never its details (3.2.7).
  "clinical.alert_flag": ["doctor", "receptionist"],
  "prescriptions.write": ["doctor"],
  // Print and reprint of an issued prescription (4.2.6).
  "prescriptions.print": ["doctor", "receptionist"],
  // 4.4.3 medical certificates: doctor writes/finalises; receptionist prints only.
  "certificates.write": ["doctor"],
  "certificates.print": ["doctor", "receptionist"],
  "appointments.manage": ["doctor", "receptionist"],
  "bills.create": ["doctor", "receptionist"],
  // Discount, refund, bill cancel (5.3.7, 5.3.8).
  "bills.adjust": ["doctor"],
  // X-rays and clinical photos / scans and consent forms (3.7.5).
  "files.clinical": ["doctor"],
  "files.documents": ["doctor", "receptionist"],
  "reports.full": ["doctor"],
  // Today's summary only (6.3.8).
  "reports.today": ["doctor", "receptionist"],
  // Receptionist: view only (timings); per-key limits come with the settings screens (1.5.x).
  "settings.read": ["doctor", "receptionist", "developer"],
  "settings.write": ["doctor", "developer"],
  "staff.manage": ["doctor"],
  "audit.view": ["doctor"],
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof PERMISSIONS;

export function isAllowed(role: Role, action: Action): boolean {
  return (PERMISSIONS[action] as readonly Role[]).includes(role);
}

export function permissionsFor(role: Role): Action[] {
  return (Object.keys(PERMISSIONS) as Action[]).filter((action) => isAllowed(role, action));
}

export function assertAllowed(ctx: Ctx, action: Action): void {
  if (!isAllowed(ctx.role, action)) throw new ForbiddenError();
}
