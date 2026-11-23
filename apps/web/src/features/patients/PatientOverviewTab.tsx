import { displayMobile, formatClockTime } from "@clinic/shared";
import { formatDate, formatMoney, plural } from "../../ui/format";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMe } from "../auth";
import { getHistorySummary, type HistorySummary } from "../history";
import { MedicalHistoryPanel } from "../medical-history";
import type { PatientDetail } from "./api";
import { ConsentsPanel } from "./ConsentsPanel";
import { PatientEditForm } from "./PatientEditForm";

type Props = {
  patient: PatientDetail;
  canEdit: boolean;
  /** Doctor: clinical.view / clinical.edit. Receptionist must not see this panel (3.2.7 / 3.3.1). */
  canViewClinical: boolean;
  canEditClinical: boolean;
  onPatientChange: (patient: PatientDetail) => void;
  /** Opens the Billing tab (the Balance card button). */
  onTakePayment: () => void;
};

// Overview: next appointment, details (or edit), medical history (doctor), consents.
export function PatientOverviewTab({
  patient,
  canEdit,
  canViewClinical,
  canEditClinical,
  onPatientChange,
  onTakePayment,
}: Props) {
  const me = useMe();
  const canWriteCert = me.permissions.includes("certificates.write");
  const canPrintCert = me.permissions.includes("certificates.print");
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState<HistorySummary | null | undefined>(undefined);
  const canTakePayment = me.permissions.includes("bills.create");

  useEffect(() => {
    let cancelled = false;
    getHistorySummary(patient.id)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [patient.id]);

  if (editing) {
    return (
      <PatientEditForm
        patient={patient}
        onSaved={(next) => {
          onPatientChange(next);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="patient-overview">
      <div className="patient-overview-cards">
        <section className="card patient-card-block" aria-labelledby="next-appt-title">
          <h2 id="next-appt-title" className="patient-card-label">
            Next appointment
          </h2>
          {summary === undefined ? (
            <p className="muted">Checking…</p>
          ) : summary?.nextAppointment ? (
            <>
              <p className="patient-card-big">
                {formatDate(summary.nextAppointment.dateLocal)},{" "}
                {formatClockTime(summary.nextAppointment.startMin)}
              </p>
              <p className="muted small">{summary.nextAppointment.visitTypeLabel}</p>
            </>
          ) : (
            <p className="muted">No upcoming appointment.</p>
          )}
        </section>
        <section className="card patient-card-block" aria-labelledby="balance-title">
          <h2 id="balance-title" className="patient-card-label">
            Balance due
          </h2>
          {summary === undefined ? (
            <p className="muted">Checking…</p>
          ) : (
            <>
              <p className="patient-card-big">{formatMoney(summary?.outstandingDuePaise ?? 0)}</p>
              {canTakePayment && (summary?.outstandingDuePaise ?? 0) > 0 ? (
                <button type="button" className="btn btn-primary" onClick={onTakePayment}>
                  Take payment
                </button>
              ) : (
                <p className="muted small">Nothing to pay.</p>
              )}
            </>
          )}
        </section>
        <section className="card patient-card-block" aria-labelledby="last-visit-title">
          <h2 id="last-visit-title" className="patient-card-label">
            Last visit
          </h2>
          {summary === undefined ? (
            <p className="muted">Checking…</p>
          ) : summary?.lastVisitDate ? (
            <>
              <p className="patient-card-big">{formatDate(summary.lastVisitDate)}</p>
              <p className="muted small">{plural(summary.totalVisits, "visit")} so far</p>
            </>
          ) : (
            <p className="muted">No visits yet.</p>
          )}
        </section>
      </div>

      <section className="patient-overview-details" aria-labelledby="details-title">
        <div className="patient-overview-details-head">
          <h2 id="details-title">Details</h2>
          {canEdit && (
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>
        <dl className="patient-overview-dl">
          <div>
            <dt>Area</dt>
            <dd>{patient.area ?? "—"}</dd>
          </div>
          <div>
            <dt>Other mobile</dt>
            <dd>{patient.mobileSecondary ? displayMobile(patient.mobileSecondary) : "—"}</dd>
          </div>
          <div>
            <dt>Guardian</dt>
            <dd>
              {patient.guardianName
                ? `${patient.guardianName}${patient.guardianRelation ? ` (${patient.guardianRelation})` : ""}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{patient.notes ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {canViewClinical && (
        <MedicalHistoryPanel
          patientId={patient.id}
          gender={patient.gender}
          canEdit={canEditClinical}
        />
      )}

      {(canWriteCert || canPrintCert) && (
        <section className="card">
          <h2>Medical certificates</h2>
          <p className="muted">Print from the register. Doctor creates and finalises.</p>
          <p className="row-actions">
            {canWriteCert ? (
              <Link
                className="btn"
                to={`/app/patients/${encodeURIComponent(patient.id)}/certificates/new`}
              >
                New certificate
              </Link>
            ) : null}
            {canPrintCert ? (
              <Link className="btn" to="/app/certificates">
                Certificate register
              </Link>
            ) : null}
          </p>
        </section>
      )}

      <ConsentsPanel patientId={patient.id} />
    </div>
  );
}
