import { api } from "../../api/client";
import type { ListItem } from "@clinic/shared";

// The doctor visit page reads everything in ONE call (GET /visits/:id/page, handoff B5).
export type PageDiagnosis = {
  id: string;
  version: number;
  listItemId: string | null;
  label: string;
  toothFdi: number | null;
  sortOrder: number;
};

export type PageProcedure = {
  id: string;
  version: number;
  listItemId: string | null;
  label: string;
  toothFdi: number | null;
  surfacesJson: string;
  note: string | null;
  moreSittings: boolean;
  defaultPaise: number | null;
  sortOrder: number;
};

export type PagePlanItem = {
  id: string;
  toothFdi: number | null;
  procedureLabel: string;
  status: string;
  sittings: number;
  sittingsDone: number;
};

export type PageVisit = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  doctorId: string;
  historyNote: string | null;
  gumCondition: string | null;
  advice: string | null;
  nextVisitNote: string | null;
  finalisedAt: string | null;
  status: "draft" | "final" | "void";
  visitDateLocal: string;
  version: number;
  chiefComplaint: string | null;
  examNote: string | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  pulse: number | null;
  noDiagnosis: boolean;
  noProcedure: boolean;
  diagnoses: PageDiagnosis[];
  procedures: PageProcedure[];
  addenda: { id: string; kind: string; body: string; reason: string; recordedAt: string }[];
};

export type VisitPageData = {
  visit: PageVisit;
  openPlanItems: PagePlanItem[];
  lastVisits: {
    id: string;
    visitDateLocal: string;
    status: string;
    chiefComplaint: string | null;
    examNote: string | null;
  }[];
  nextAppointment: {
    id: string;
    dateLocal: string;
    startMin: number;
    visitTypeLabel: string;
  } | null;
  duesPaise: number;
  files: {
    id: string;
    kind: string;
    mime: string;
    originalFilename: string;
    caption: string | null;
    toothFdi: number | null;
    takenOn: string | null;
    createdAt: string;
  }[];
  previousMedicines: {
    rxNo: string | null;
    issuedAt: string | null;
    items: {
      genericName: string;
      brand: string;
      strength: string;
      frequency: string;
      days: string;
    }[];
  } | null;
  followUp: {
    dueOn: string;
    daysLate: number;
    medsFinishedOn: string | null;
    state: "upcoming" | "due_today" | "late";
  } | null;
};

export function getVisitPage(id: string): Promise<VisitPageData> {
  return api<VisitPageData>(`/api/staff/visits/${encodeURIComponent(id)}/page`);
}

/** Counts of lines by name in the last 30 days (doctor only), for the "popular" first rows. */
export type LineUsage = { diagnoses: Record<string, number>; procedures: Record<string, number> };

export function getLineUsage(): Promise<LineUsage> {
  return api<LineUsage>("/api/staff/library/line-usage");
}

export type ListsPair = { diagnoses: ListItem[]; procedures: ListItem[] };
