import type { HistoryEntryType, HistoryFilterChip } from "@clinic/shared";
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

export type HistoryFeedQuery = {
  cursor?: string;
  limit?: number;
  chip?: HistoryFilterChip;
  from?: string;
  to?: string;
  tooth?: number;
  q?: string;
};

export function getHistorySummary(patientId: string) {
  return api<{ summary: HistorySummary }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/history/summary`,
  ).then((r) => r.summary);
}

export function listHistoryFeed(patientId: string, opts?: HistoryFeedQuery) {
  const q = new URLSearchParams();
  if (opts?.cursor) q.set("cursor", opts.cursor);
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  if (opts?.chip && opts.chip !== "all") q.set("chip", opts.chip);
  if (opts?.from) q.set("from", opts.from);
  if (opts?.to) q.set("to", opts.to);
  if (opts?.tooth != null) q.set("tooth", String(opts.tooth));
  if (opts?.q) q.set("q", opts.q);
  const qs = q.toString();
  return api<HistoryFeedPage>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/history${qs ? `?${qs}` : ""}`,
  );
}
