export const ROLES = ["doctor", "receptionist", "developer"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["active", "disabled"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// Every gap-free number comes from the counters table (AGENTS.md data rules).
export const COUNTER_NAMES = [
  "patient_code",
  "prescription",
  "bill",
  "receipt",
  "refund",
  "certificate",
] as const;
export type CounterName = (typeof COUNTER_NAMES)[number];

// "delete" is always a soft delete (deleted_at is set).
export const AUDIT_ACTIONS = ["create", "update", "delete", "restore"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ACCESS_ACTIONS = ["login", "view", "export"] as const;
export type AccessAction = (typeof ACCESS_ACTIONS)[number];

export const FILE_KINDS = [
  "iopa",
  "opg",
  "photo",
  "scan",
  "consent",
  "logo",
  "signature",
  "other",
] as const;
export type FileKind = (typeof FILE_KINDS)[number];

export const FILE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export type FileMimeType = (typeof FILE_MIME_TYPES)[number];
