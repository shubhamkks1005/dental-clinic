import type { HistoryEntryType } from "@clinic/shared";
import { api } from "../../api/client";

export type HistorySummary = {
  firstVisitDate: string | null;
  lastVisitDate: string | null;
  totalVisits: number;
  alertLabels: string[];
  hasAlert: boolean;
  hasRestricted: boolean;
  outstandingDuePaise: number;
  nextAppointment: {
    id: string;
    dateLocal: string;
    startMin: number;
    visitTypeLabel: string;
  } | null;
};

export type HistoryFeedEntry = {
  id: string;
  type: HistoryEntryType;
  at: string;
  summary: string;
  actorName: string | null;
  status: string | null;
  href: string;
};

export type HistoryFeedPage = {
  entries: HistoryFeedEntry[];
  nextCursor: string | null;
};

export function getHistorySummary(patientId: string) {
  return api<{ summary: HistorySummary }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/history/summary`,
  ).then((r) => r.summary);
}

export function listHistoryFeed(patientId: string, opts?: { cursor?: string; limit?: number }) {
  const q = new URLSearchParams();
  if (opts?.cursor) q.set("cursor", opts.cursor);
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  const qs = q.toString();
  return api<HistoryFeedPage>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/history${qs ? `?${qs}` : ""}`,
  );
}
