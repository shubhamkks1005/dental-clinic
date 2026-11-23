export {
  accessInsert,
  accessInsertIfChanged,
  auditInsert,
  auditInsertIfChanged,
  type AccessEntry,
  type AuditEntry,
} from "./audit";
export { createDb, type D1Binding, type Db } from "./client";
export type { Ctx } from "./context";
export {
  ConflictError,
  ForbiddenError,
  InvalidError,
  NotAllowedError,
  NotFoundError,
  RepoError,
} from "./errors";
export { NEVER_RESETS, patientCodeSql, takeNumber, takePatientCode } from "./numbering";
export { pingDb } from "./ping";
export { rebuildPatientSearchStatements } from "./search/patient-tokens";
export { assertAllowed, isAllowed, PERMISSIONS, permissionsFor, type Action } from "./permissions";
export { createRepos, type Repos } from "./repos";
export type { PurgeResult } from "./repos/retention";
export {
  authRepo,
  type AuthRepo,
  type NewSession,
  type SessionRow,
  type StaffUser,
} from "./repos/auth";
export {
  PATIENT_LIST_SORTABLE,
  patientsRepo,
  type PatientListFilter,
  type PatientListOptions,
  type PatientListRow,
  type PatientListStatus,
} from "./repos/patients";
export { patientArchiveRepo } from "./repos/patient-archive";
export { patientCreateRepo, type CreatedPatient } from "./repos/patient-create";
export { patientGetRepo, type PatientDetail } from "./repos/patient-get";
export { patientUpdateRepo } from "./repos/patient-update";
export {
  patientDuplicatesRepo,
  type DuplicateHit,
  type DuplicateProbe,
  type DuplicateReason,
} from "./repos/patient-duplicates";
export { consentsRepo, type NewConsent } from "./repos/consents";
export { filesRepo, type FileRecord, type InsertFileInput } from "./repos/files";
export type { SettingRow, SettingValue } from "./repos/settings";
