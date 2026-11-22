import type { Role, UserStatus } from "./enums";

// Settings > Staff (1.3.6). The doctor can give only these two roles; developer accounts are
// created by the developer and can only be deactivated or reactivated here.
export const STAFF_ROLES = ["doctor", "receptionist"] as const satisfies readonly Role[];
export type StaffRole = (typeof STAFF_ROLES)[number];
export const isStaffRole = (role: unknown): role is StaffRole =>
  STAFF_ROLES.includes(role as StaffRole);

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  googleLinked: boolean;
  lastLoginAt: string | null;
  version: number;
  isYou: boolean;
};

export type NewStaff = { name: string; email: string; role: StaffRole };

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

// The one email normaliser (sign-in and the staff list must agree on it).
export const normaliseEmail = (raw: string) => raw.trim().toLowerCase();

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const NAME_MAX = 80;

function cleanName(raw: unknown): Parsed<string> {
  const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (!name) return { ok: false, message: "Enter the person's name." };
  if (name.length > NAME_MAX) return { ok: false, message: "The name is too long." };
  if (/[\u0000-\u001f\u007f]/.test(name))
    return { ok: false, message: "The name has odd characters." };
  return { ok: true, value: name };
}

function cleanEmail(raw: unknown): Parsed<string> {
  const email = typeof raw === "string" ? normaliseEmail(raw) : "";
  if (!email) return { ok: false, message: "Enter the person's Gmail address." };
  if (email.length > 254 || !EMAIL.test(email)) {
    return {
      ok: false,
      message: "That does not look like an email address. Check it and try again.",
    };
  }
  return { ok: true, value: email };
}

function cleanRole(raw: unknown): Parsed<StaffRole> {
  return isStaffRole(raw)
    ? { ok: true, value: raw }
    : { ok: false, message: "Choose Doctor or Receptionist." };
}

function cleanVersion(raw: unknown): Parsed<number> {
  return Number.isInteger(raw) && (raw as number) > 0
    ? { ok: true, value: raw as number }
    : { ok: false, message: "This page is out of date. Reload it and try again." };
}

const field = (input: unknown, key: string): unknown =>
  typeof input === "object" && input !== null ? (input as Record<string, unknown>)[key] : undefined;

export function parseNewStaff(input: unknown): Parsed<NewStaff> {
  const name = cleanName(field(input, "name"));
  if (!name.ok) return name;
  const email = cleanEmail(field(input, "email"));
  if (!email.ok) return email;
  const role = cleanRole(field(input, "role"));
  if (!role.ok) return role;
  return { ok: true, value: { name: name.value, email: email.value, role: role.value } };
}

export function parseVersionOnly(input: unknown): Parsed<{ version: number }> {
  const version = cleanVersion(field(input, "version"));
  return version.ok ? { ok: true, value: { version: version.value } } : version;
}

export function parseRoleChange(input: unknown): Parsed<{ role: StaffRole; version: number }> {
  const role = cleanRole(field(input, "role"));
  if (!role.ok) return role;
  const version = cleanVersion(field(input, "version"));
  if (!version.ok) return version;
  return { ok: true, value: { role: role.value, version: version.value } };
}

export function parseGoogleReset(input: unknown): Parsed<{ email: string; version: number }> {
  const email = cleanEmail(field(input, "email"));
  if (!email.ok) return email;
  const version = cleanVersion(field(input, "version"));
  if (!version.ok) return version;
  return { ok: true, value: { email: email.value, version: version.value } };
}
