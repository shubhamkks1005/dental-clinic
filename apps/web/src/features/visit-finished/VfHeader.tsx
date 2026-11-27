import { istDate } from "@clinic/shared";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { problemText } from "../../api/problem-text";
import { useSubmitOnce } from "../../ui/submit-guard";
import { ProfileAlerts } from "../medical-history";
import type { PatientDetail } from "../patients";
import { revisePrescription, type PrescriptionDto } from "../prescriptions";
import { patientStripFacts } from "../visits/visit-patient-strip";
import { passRxToDesk } from "./api";
import { istClock } from "./invoice-model";
import { VfIcon } from "./vf-icons";

type Props = {
  visitId: string;
  finalisedAt: string | null;
  patient: PatientDetail | null;
  rx: PrescriptionDto | null;
  onAddAddendum: () => void;
  onError: (text: string) => void;
  toast: (text: string) => void;
};

// Sticky header (HTML 275-317) with the owner's changes: finalised line, alert mark (review Q3),
// Revise prescription + Add addendum (Q8), Pass to reception · Prescription (Q1).
export function VfHeader({
  visitId,
  finalisedAt,
  patient,
  rx,
  onAddAddendum,
  onError,
  toast,
}: Props) {
  const navigate = useNavigate();
  const [passed, setPassed] = useState(false);
  const pass = useSubmitOnce();
  const revise = useSubmitOnce();
  const issued = rx && rx.status !== "draft";
  const facts = patient ? patientStripFacts(patient, istDate(new Date())) : null;

  return (
    <header className="vf-head">
      <div className="vf-head-left">
        <Link to="/app" className="vf-btn">
          <VfIcon name="back" /> Back to Today
        </Link>
        <div>
          <h1 className="vf-title">Visit finished</h1>
          {finalisedAt && (
            <p className="vf-sub">
              Visit finalised {istClock(finalisedAt)}. The visit is now read only.
            </p>
          )}
          {patient && (
            <div className="vf-strip" aria-label="Patient">
              <strong>{patient.fullName}</strong>
              {facts?.ageGender && <span>· {facts.ageGender}</span>}
              <span className="vf-mono vf-code">· {patient.code}</span>
              <ProfileAlerts patientId={patient.id} canViewClinical canSeeFlags />
            </div>
          )}
        </div>
      </div>
      <div className="vf-head-actions">
        {issued && (
          <button
            type="button"
            className="vf-btn"
            disabled={revise.pending}
            onClick={() =>
              void revise.run(async () => {
                try {
                  await revisePrescription(rx.id);
                  navigate(`/app/visits/${visitId}`);
                } catch (err) {
                  onError(problemText(err));
                }
              })
            }
          >
            <VfIcon name="edit" /> {revise.pending ? "Opening..." : "Revise prescription"}
          </button>
        )}
        <button type="button" className="vf-btn" onClick={onAddAddendum}>
          <VfIcon name="add" /> Add addendum
        </button>
        <button
          type="button"
          className={`vf-btn ${passed ? "vf-btn-done" : "vf-btn-primary"}`}
          disabled={!issued || passed || pass.pending}
          title={issued ? undefined : "Issue the prescription first."}
          onClick={() =>
            void pass.run(async () => {
              try {
                await passRxToDesk(rx!.id);
                setPassed(true);
                toast("Prescription passed to reception.");
              } catch (err) {
                onError(problemText(err));
              }
            })
          }
        >
          {passed ? <VfIcon name="check" className="vf-pop" /> : <VfIcon name="send" />}
          <span className="vf-btn-stack">
            <span>
              {pass.pending ? "Passing..." : passed ? "Passed to reception" : "Pass to reception"}
            </span>
            <small>Prescription</small>
          </span>
        </button>
      </div>
    </header>
  );
}
