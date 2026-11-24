import { istDate } from "@clinic/shared";
import { scopeKey, type RequestScope } from "../../ui/request-scope";
import { listDayAppointments } from "../appointments/api";
import { getPatientChart, loadChartView } from "../chart/api";
import { listPatientBills } from "../billing";
import { getList } from "../lists/api";
import { getAlertFlags, getMedicalHistory } from "../medical-history/api";
import { getPatientConsents, listPatientAppointments } from "../patients/api";
import { listVisitPrescriptions } from "../prescriptions/api";

/** What the signed-in person may see and do on the visit screen. */
export type VisitAccess = {
  canViewClinical: boolean;
  canEdit: boolean;
  canWriteRx: boolean;
  /** Receptionist: the visit header shows alert flags only. */
  canSeeFlags?: boolean;
};

type LoadedVisit = { id: string; patientId: string; status: "draft" | "final" | "void" };

/** Settings lists are shared for the life of the screen, so two panels never ask twice. */
export function listOnce(scope: RequestScope, key: Parameters<typeof getList>[0]) {
  return scope.shared(scopeKey.list(key), () => getList(key));
}

/** Round 1, together with getVisit: only what needs neither the visit nor the patient. */
export function prefetchOnOpen(scope: RequestScope, visitId: string, access: VisitAccess) {
  void listOnce(scope, "diagnoses").catch(() => {});
  void listOnce(scope, "quick_phrases").catch(() => {});
  if (!access.canWriteRx) return;
  void listOnce(scope, "medicines").catch(() => {});
  void listOnce(scope, "medicine_sets").catch(() => {});
  void listOnce(scope, "allergens").catch(() => {});
  scope.prefetch(scopeKey.visitPrescriptions(visitId), () => listVisitPrescriptions(visitId));
}

/**
 * Round 2, right after getVisit: everything the panels will ask for once the patient arrives.
 * It mirrors what each panel shows, so a panel that is not shown costs no request.
 */
export function prefetchForVisit(scope: RequestScope, visit: LoadedVisit, access: VisitAccess) {
  const { patientId } = visit;
  const draft = visit.status === "draft";
  scope.prefetch(scopeKey.bills(patientId), () => listPatientBills(patientId));
  scope.prefetch(scopeKey.patientAppointments(patientId), () => listPatientAppointments(patientId));
  if (access.canWriteRx || access.canViewClinical) {
    scope.prefetch(scopeKey.medicalHistory(patientId), () => getMedicalHistory(patientId));
  } else if (access.canSeeFlags) {
    scope.prefetch(scopeKey.alertFlags(patientId), () => getAlertFlags(patientId));
  }
  if (draft) {
    void listOnce(scope, "procedures").catch(() => {});
    if (access.canEdit) {
      scope.prefetch(scopeKey.consents(patientId), () => getPatientConsents(patientId));
    }
    if (access.canViewClinical) {
      void listOnce(scope, "conditions").catch(() => {});
      void scope.shared(scopeKey.chartView(), loadChartView).catch(() => {});
      scope.prefetch(scopeKey.chart(patientId, undefined, visit.id), () =>
        getPatientChart(patientId, { highlightVisitId: visit.id }),
      );
    }
  } else if (visit.status === "final") {
    const today = istDate(new Date());
    scope.prefetch(scopeKey.dayAppointments(today), () => listDayAppointments(today));
  }
}
