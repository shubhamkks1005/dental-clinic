import type { PATIENT_REQUEST_STATUSES } from "@clinic/shared";
import { api } from "../../api/client";

export type RequestStatus = (typeof PATIENT_REQUEST_STATUSES)[number];

export type RequestRow = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  type: string;
  status: RequestStatus;
  dueOn: string;
  createdAt: string;
  closedAt: string | null;
  version: number;
  overdue: boolean;
};

export type RequestDetail = RequestRow & { body: string; closedNote: string | null };

export const listRequests = (status: RequestStatus | "all") =>
  api<{ requests: RequestRow[] }>(`/api/staff/patient-requests?status=${status}`).then(
    (r) => r.requests,
  );

export const getRequest = (id: string) =>
  api<{ request: RequestDetail }>(`/api/staff/patient-requests/${encodeURIComponent(id)}`).then(
    (r) => r.request,
  );

export const closeRequest = (
  id: string,
  input: { status: "done" | "rejected"; note: string; version: number },
) =>
  api<{ id: string }>(`/api/staff/patient-requests/${encodeURIComponent(id)}/close`, {
    method: "POST",
    body: input,
  });
