import type { Db } from "../client";
import type { Ctx } from "../context";
import { appointmentsBookRepo } from "./appointments-book";
import { appointmentsCancelRepo } from "./appointments-cancel";
import { appointmentsListRepo } from "./appointments-list";
import { appointmentsRescheduleRepo } from "./appointments-reschedule";
import { appointmentsSlotsRepo } from "./appointments-slots";
import { appointmentsStatusRepo } from "./appointments-status";
import { appointmentsWalkInRepo } from "./appointments-walk-in";
import { consentsRepo } from "./consents";
import { listsRepo } from "./lists";
import { patientArchiveRepo } from "./patient-archive";
import { patientCreateRepo } from "./patient-create";
import { patientDuplicatesRepo } from "./patient-duplicates";
import { patientGetRepo } from "./patient-get";
import { patientsRepo } from "./patients";
import { patientUpdateRepo } from "./patient-update";
import { settingsRepo } from "./settings";
import { staffRepo } from "./staff";
import { medicalHistoryRepo } from "./medical-history";
import { planItemsRepo } from "./plan-items";
import { toothEventsRepo } from "./tooth-events";
import { visitDiagnosesRepo } from "./visit-diagnoses";
import { visitProceduresRepo } from "./visit-procedures";
import { filesRepo } from "./files";
import { historyFeedRepo } from "./history-feed";
import { historySummaryRepo } from "./history-summary";
import { visitsDraftsRepo } from "./visits-drafts";
import { visitsFinaliseRepo } from "./visits-finalise";
import { visitsGetRepo } from "./visits-get";
import { visitsOpenRepo } from "./visits-open";
import { visitsPatchRepo } from "./visits-patch";
import { visitsTimelineRepo } from "./visits-timeline";
import { prescriptionsCreateRepo } from "./prescriptions-create";
import { prescriptionsDraftRepo } from "./prescriptions-draft";
import { prescriptionsGetRepo } from "./prescriptions-get";
import { prescriptionsIssueRepo } from "./prescriptions-issue";
import { printLogRepo } from "./print-log";
import { certificatesGetRepo } from "./certificates-get";
import { certificatesWriteRepo } from "./certificates-write";
import { certificatesFinaliseRepo } from "./certificates-finalise";
import { billsCreateRepo } from "./bills-create";
import { billsGetRepo } from "./bills-get";
import { billsIssueRepo } from "./bills-issue";
import { billsCancelRepo } from "./bills-cancel";
import { billsLockRepo } from "./bills-lock";
import { billsListRepo } from "./bills-list";
import { billsFromVisitRepo } from "./bills-from-visit";
import { billsDuesListRepo } from "./bills-dues-list";
import { duesCallsRepo } from "./dues-calls";
import { paymentsCreateRepo } from "./payments-create";
import { refundsCreateRepo } from "./refunds-create";

// All SQL lives in repositories. The Worker builds this once per request and hands it to
// domain functions; route files never touch the database (apps/worker architecture test).
export function createRepos(db: Db, ctx: Ctx) {
  return {
    settings: settingsRepo(db, ctx),
    staff: staffRepo(db, ctx),
    lists: listsRepo(db, ctx),
    patients: {
      ...patientsRepo(db, ctx),
      ...patientArchiveRepo(db, ctx),
      ...patientCreateRepo(db, ctx),
      ...patientGetRepo(db, ctx),
      ...patientUpdateRepo(db, ctx),
    },
    patientDuplicates: patientDuplicatesRepo(db, ctx),
    consents: consentsRepo(db, ctx),
    appointments: {
      ...appointmentsBookRepo(db, ctx),
      ...appointmentsStatusRepo(db, ctx),
      ...appointmentsWalkInRepo(db, ctx),
      ...appointmentsCancelRepo(db, ctx),
      ...appointmentsRescheduleRepo(db, ctx),
      ...appointmentsListRepo(db, ctx),
      ...appointmentsSlotsRepo(db, ctx),
    },
    visits: {
      ...visitsOpenRepo(db, ctx),
      ...visitsGetRepo(db, ctx),
      ...visitsFinaliseRepo(db, ctx),
      ...visitsPatchRepo(db, ctx),
      ...visitsDraftsRepo(db, ctx),
      ...visitsTimelineRepo(db, ctx),
    },
    toothEvents: toothEventsRepo(db, ctx),
    visitDiagnoses: visitDiagnosesRepo(db, ctx),
    visitProcedures: visitProceduresRepo(db, ctx),
    medicalHistory: medicalHistoryRepo(db, ctx),
    planItems: planItemsRepo(db, ctx),
    history: {
      ...historySummaryRepo(db, ctx),
      ...historyFeedRepo(db, ctx),
    },
    files: filesRepo(db, ctx),
    prescriptions: {
      ...prescriptionsCreateRepo(db, ctx),
      ...prescriptionsGetRepo(db, ctx),
      ...prescriptionsDraftRepo(db, ctx),
      ...prescriptionsIssueRepo(db, ctx),
    },
    printLog: printLogRepo(db, ctx),
    certificates: {
      ...certificatesGetRepo(db, ctx),
      ...certificatesWriteRepo(db, ctx),
      ...certificatesFinaliseRepo(db, ctx),
    },
    bills: {
      ...billsCreateRepo(db, ctx),
      ...billsGetRepo(db, ctx),
      ...billsIssueRepo(db, ctx),
      ...billsCancelRepo(db, ctx),
      ...billsLockRepo(db, ctx),
      ...billsListRepo(db, ctx),
      ...billsFromVisitRepo(db, ctx),
      ...billsDuesListRepo(db, ctx),
    },
    payments: {
      ...paymentsCreateRepo(db, ctx),
    },
    refunds: {
      ...refundsCreateRepo(db, ctx),
    },
    duesCalls: duesCallsRepo(db, ctx),
  };
}

export type Repos = ReturnType<typeof createRepos>;
