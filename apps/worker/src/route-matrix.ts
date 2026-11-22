import { isAllowed, type Action } from "@clinic/db";
import type { Role } from "@clinic/shared";

// 1.7.4: every staff API route must appear here. CI fails if a new route is registered
// without an entry (or if an entry points at a removed route).
export type RouteAccess =
  { kind: "public" } | { kind: "signed_in" } | { kind: "permission"; action: Action };

export type MatrixEntry = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  access: RouteAccess;
};

export const STAFF_ROUTE_MATRIX: readonly MatrixEntry[] = [
  { method: "GET", path: "/api/staff/health", access: { kind: "public" } },
  { method: "GET", path: "/api/staff/auth/branding", access: { kind: "public" } },
  { method: "GET", path: "/api/staff/auth/start", access: { kind: "public" } },
  { method: "GET", path: "/api/staff/auth/callback", access: { kind: "public" } },
  { method: "POST", path: "/api/staff/auth/logout", access: { kind: "signed_in" } },
  { method: "GET", path: "/api/staff/me", access: { kind: "signed_in" } },
  {
    method: "GET",
    path: "/api/staff/settings",
    access: { kind: "permission", action: "settings.read" },
  },
  {
    method: "PUT",
    path: "/api/staff/settings/:key",
    access: { kind: "permission", action: "settings.write" },
  },
  {
    method: "GET",
    path: "/api/staff/lists/:key",
    access: { kind: "permission", action: "settings.read" },
  },
  {
    method: "POST",
    path: "/api/staff/lists/:key",
    access: { kind: "permission", action: "settings.write" },
  },
  {
    method: "PUT",
    path: "/api/staff/lists/:key/:id",
    access: { kind: "permission", action: "settings.write" },
  },
  {
    method: "POST",
    path: "/api/staff/lists/:key/:id/active",
    access: { kind: "permission", action: "settings.write" },
  },
  {
    method: "POST",
    path: "/api/staff/lists/:key/:id/move",
    access: { kind: "permission", action: "settings.write" },
  },
  {
    method: "GET",
    path: "/api/staff/users",
    access: { kind: "permission", action: "staff.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/users",
    access: { kind: "permission", action: "staff.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/users/:id/deactivate",
    access: { kind: "permission", action: "staff.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/users/:id/reactivate",
    access: { kind: "permission", action: "staff.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/users/:id/role",
    access: { kind: "permission", action: "staff.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/users/:id/google-reset",
    access: { kind: "permission", action: "staff.manage" },
  },
];

export const matrixKey = (method: string, path: string) => `${method} ${path}`;

export function rolesDenied(action: Action): Role[] {
  return (["doctor", "receptionist", "developer"] as const).filter((r) => !isAllowed(r, action));
}

export function rolesAllowed(action: Action): Role[] {
  return (["doctor", "receptionist", "developer"] as const).filter((r) => isAllowed(r, action));
}
