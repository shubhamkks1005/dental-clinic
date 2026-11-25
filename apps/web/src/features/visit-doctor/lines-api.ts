import { api } from "../../api/client";
import type { ToothSurface } from "@clinic/shared";
import type { PageDiagnosis, PageProcedure } from "./page-api";

const base = (visitId: string, kind: "diagnoses" | "procedures") =>
  `/api/staff/visits/${encodeURIComponent(visitId)}/${kind}`;

export type ProcedureRow = Omit<PageProcedure, "surfacesJson"> & { surfaces: ToothSurface[] };

export const addDiagnosis = (
  visitId: string,
  body: { listItemId?: string | null; freeText?: string | null; toothFdi?: number | null },
) => api<{ diagnosis: PageDiagnosis }>(base(visitId, "diagnoses"), { method: "POST", body });

export const updateDiagnosis = (
  visitId: string,
  lineId: string,
  body: { version: number; toothFdi: number | null },
) =>
  api<{ diagnosis: PageDiagnosis }>(`${base(visitId, "diagnoses")}/${lineId}`, {
    method: "PATCH",
    body,
  });

export const removeDiagnosis = (visitId: string, lineId: string, version: number) =>
  api<{ version: number }>(`${base(visitId, "diagnoses")}/${lineId}`, {
    method: "DELETE",
    body: { version },
  });

export const restoreDiagnosis = (visitId: string, lineId: string, version: number) =>
  api<{ diagnosis: PageDiagnosis }>(`${base(visitId, "diagnoses")}/${lineId}/restore`, {
    method: "POST",
    body: { version },
  });

export const addProcedure = (
  visitId: string,
  body: { listItemId: string; toothFdi?: number | null; surfaces?: ToothSurface[] },
) => api<{ procedure: ProcedureRow }>(base(visitId, "procedures"), { method: "POST", body });

export const updateProcedure = (
  visitId: string,
  lineId: string,
  body: {
    version: number;
    toothFdi?: number | null;
    surfaces?: ToothSurface[];
    note?: string | null;
    moreSittings?: boolean;
  },
) =>
  api<{ procedure: ProcedureRow }>(`${base(visitId, "procedures")}/${lineId}`, {
    method: "PATCH",
    body,
  });

export const removeProcedure = (visitId: string, lineId: string, version: number) =>
  api<{ version: number }>(`${base(visitId, "procedures")}/${lineId}`, {
    method: "DELETE",
    body: { version },
  });

export const restoreProcedure = (visitId: string, lineId: string, version: number) =>
  api<{ procedure: ProcedureRow }>(`${base(visitId, "procedures")}/${lineId}/restore`, {
    method: "POST",
    body: { version },
  });

/** Add a procedure to the doctor's own list (name and fee in paise, no code) and get the item back. */
export const addProcedureToList = (label: string, defaultPaise: number) =>
  api<{ item: { id: string; label: string; data: { default_paise?: number } } | null }>(
    "/api/staff/lists/procedures",
    { method: "POST", body: { label, data: { default_paise: defaultPaise } } },
  );

/** "No diagnosis / No procedure for this visit" lives on the visit (migration 0058). */
export const setNoneFlag = (
  visitId: string,
  body: { version: number; noDiagnosis?: boolean; noProcedure?: boolean },
) =>
  api<{ visit: { version: number; noDiagnosis: boolean; noProcedure: boolean } }>(
    `/api/staff/visits/${encodeURIComponent(visitId)}`,
    { method: "PATCH", body },
  );
