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
  {
    method: "GET",
    path: "/api/staff/patients",
    access: { kind: "permission", action: "patients.view" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id",
    access: { kind: "permission", action: "patients.view" },
  },
  {
    method: "POST",
    path: "/api/staff/patients",
    access: { kind: "permission", action: "patients.edit" },
  },
  {
    method: "PUT",
    path: "/api/staff/patients/:id",
    access: { kind: "permission", action: "patients.edit" },
  },
  {
    method: "POST",
    path: "/api/staff/patients/duplicate-check",
    access: { kind: "permission", action: "patients.view" },
  },
  {
    method: "POST",
    path: "/api/staff/patients/:id/archive",
    access: { kind: "permission", action: "patients.edit" },
  },
  {
    method: "POST",
    path: "/api/staff/patients/:id/restore",
    access: { kind: "permission", action: "patients.edit" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/consents",
    access: { kind: "permission", action: "patients.view" },
  },
  {
    method: "POST",
    path: "/api/staff/patients/:id/consents",
    access: { kind: "permission", action: "patients.edit" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/appointments",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "GET",
    path: "/api/staff/appointments",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/appointments",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "GET",
    path: "/api/staff/appointments/slots",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/appointments/walk-in",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/appointments/:id/cancel",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "POST",
    path: "/api/staff/appointments/:id/reschedule",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "GET",
    path: "/api/staff/appointments/:id/chain",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "PATCH",
    path: "/api/staff/appointments/:id/status",
    access: { kind: "permission", action: "appointments.manage" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/medical-history",
    access: { kind: "permission", action: "clinical.view" },
  },
  {
    method: "POST",
    path: "/api/staff/patients/:id/medical-history",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/alert-flags",
    access: { kind: "permission", action: "clinical.alert_flag" },
  },
  {
    method: "POST",
    path: "/api/staff/visits",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "GET",
    path: "/api/staff/visits/drafts",
    access: { kind: "permission", action: "clinical.view" },
  },
  {
    method: "GET",
    path: "/api/staff/visits/:id",
    access: { kind: "permission", action: "clinical.view" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/visits/timeline",
    access: { kind: "permission", action: "clinical.view" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/visits",
    access: { kind: "permission", action: "clinical.view" },
  },
  {
    method: "PATCH",
    path: "/api/staff/visits/:id",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "POST",
    path: "/api/staff/visits/:id/diagnoses",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "POST",
    path: "/api/staff/visits/:id/procedures",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "POST",
    path: "/api/staff/visits/:id/finalise",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "POST",
    path: "/api/staff/visits/:id/addenda",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/chart",
    access: { kind: "permission", action: "clinical.view" },
  },
  {
    method: "POST",
    path: "/api/staff/patients/:id/chart/events",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/history/summary",
    access: { kind: "permission", action: "patients.view" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/history",
    access: { kind: "permission", action: "patients.view" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/plan-items",
    access: { kind: "permission", action: "clinical.view" },
  },
  {
    method: "POST",
    path: "/api/staff/plan-items",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "PATCH",
    path: "/api/staff/plan-items/:id/estimate",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "PATCH",
    path: "/api/staff/plan-items/:id/decision",
    access: { kind: "permission", action: "clinical.edit" },
  },
  {
    method: "GET",
    path: "/api/staff/storage/usage",
    access: { kind: "permission", action: "settings.read" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/files",
    access: { kind: "permission", action: "files.documents" },
  },
  {
    method: "POST",
    path: "/api/staff/patients/:id/files",
    access: { kind: "permission", action: "files.documents" },
  },
  {
    method: "GET",
    path: "/api/staff/files/:id",
    access: { kind: "permission", action: "files.documents" },
  },
  {
    method: "GET",
    path: "/api/staff/files/:id/content",
    access: { kind: "permission", action: "files.documents" },
  },
  {
    method: "DELETE",
    path: "/api/staff/files/:id",
    access: { kind: "permission", action: "files.documents" },
  },
  {
    method: "POST",
    path: "/api/staff/prescriptions",
    access: { kind: "permission", action: "prescriptions.write" },
  },
  {
    method: "GET",
    path: "/api/staff/prescriptions/:id",
    access: { kind: "permission", action: "prescriptions.print" },
  },
  {
    method: "GET",
    path: "/api/staff/visits/:id/prescriptions",
    access: { kind: "permission", action: "prescriptions.write" },
  },
  {
    method: "PUT",
    path: "/api/staff/prescriptions/:id/items",
    access: { kind: "permission", action: "prescriptions.write" },
  },
  {
    method: "PATCH",
    path: "/api/staff/prescriptions/:id",
    access: { kind: "permission", action: "prescriptions.write" },
  },
  {
    method: "POST",
    path: "/api/staff/prescriptions/:id/issue",
    access: { kind: "permission", action: "prescriptions.write" },
  },
  {
    method: "POST",
    path: "/api/staff/prescriptions/:id/revise",
    access: { kind: "permission", action: "prescriptions.write" },
  },
  {
    method: "POST",
    path: "/api/staff/prescriptions/copy-previous",
    access: { kind: "permission", action: "prescriptions.write" },
  },
  {
    method: "POST",
    path: "/api/staff/print-log",
    access: { kind: "permission", action: "patients.view" },
  },
  {
    method: "GET",
    path: "/api/staff/print-log/preview",
    access: { kind: "permission", action: "patients.view" },
  },
  {
    method: "POST",
    path: "/api/staff/certificates",
    access: { kind: "permission", action: "certificates.write" },
  },
  {
    method: "GET",
    path: "/api/staff/certificates",
    access: { kind: "permission", action: "certificates.print" },
  },
  {
    method: "GET",
    path: "/api/staff/certificates/:id",
    access: { kind: "permission", action: "certificates.print" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/certificates",
    access: { kind: "permission", action: "certificates.print" },
  },
  {
    method: "PATCH",
    path: "/api/staff/certificates/:id",
    access: { kind: "permission", action: "certificates.write" },
  },
  {
    method: "POST",
    path: "/api/staff/certificates/:id/finalise",
    access: { kind: "permission", action: "certificates.write" },
  },
  {
    method: "POST",
    path: "/api/staff/certificates/:id/revise",
    access: { kind: "permission", action: "certificates.write" },
  },
  {
    method: "GET",
    path: "/api/staff/bills/dues",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "POST",
    path: "/api/staff/bills",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "GET",
    path: "/api/staff/bills/:id",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "POST",
    path: "/api/staff/patients/:id/dues-calls",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "POST",
    path: "/api/staff/bills/:id/issue",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "POST",
    path: "/api/staff/bills/:id/discount",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "POST",
    path: "/api/staff/bills/:id/discount/approve",
    access: { kind: "permission", action: "bills.adjust" },
  },
  {
    method: "POST",
    path: "/api/staff/bills/:id/cancel",
    access: { kind: "permission", action: "bills.adjust" },
  },
  {
    method: "POST",
    path: "/api/staff/visits/:id/bill",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/bills",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "GET",
    path: "/api/staff/patients/:id/payments",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "POST",
    path: "/api/staff/payments",
    access: { kind: "permission", action: "bills.create" },
  },
  {
    method: "POST",
    path: "/api/staff/refunds",
    access: { kind: "permission", action: "bills.adjust" },
  },
];

export const matrixKey = (method: string, path: string) => `${method} ${path}`;

export function rolesDenied(action: Action): Role[] {
  return (["doctor", "receptionist", "developer"] as const).filter((r) => !isAllowed(r, action));
}

export function rolesAllowed(action: Action): Role[] {
  return (["doctor", "receptionist", "developer"] as const).filter((r) => isAllowed(r, action));
}
