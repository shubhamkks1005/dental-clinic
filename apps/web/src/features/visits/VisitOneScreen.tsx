import type { FdiTooth, ListItem } from "@clinic/shared";
import { useEffect, useState } from "react";
import type { PatientDetail } from "../patients";
import { VisitMedicinesPanel, type RxStatus } from "../prescriptions";
import { getList } from "../lists";
import type { VisitRecent, VisitSummary } from "./api";
import { useVisitNotes } from "./useVisitNotes";
import { VisitAddenda } from "./VisitAddenda";
import { VisitContextPanel } from "./VisitContextPanel";
import { VisitFinalView } from "./VisitFinalView";
import { VisitNextSteps } from "./VisitNextSteps";
import { VisitStickyBar } from "./VisitStickyBar";
import { VisitWorkColumn } from "./VisitWorkColumn";
import "./visit-one.css";

type Props = {
  visit: VisitSummary;
  patient: PatientDetail;
  recent: VisitRecent[];
  canEdit: boolean;
  canViewClinical: boolean;
  canWriteRx: boolean;
  canBill: boolean;
  onVisitChange: (visit: VisitSummary) => void;
  onToothFocus: (tooth: FdiTooth | null) => void;
};

/** The whole visit on one screen: work on the left, prescription and context on the right. */
export function VisitOneScreen(props: Props) {
  const { visit, patient, recent, canEdit, canViewClinical, canWriteRx, canBill } = props;
  const readOnly = !canEdit || visit.status !== "draft";
  const [diagnosisList, setDiagnosisList] = useState<ListItem[]>([]);
  const [phrases, setPhrases] = useState<ListItem[]>([]);
  const [rxStatus, setRxStatus] = useState<RxStatus>("none");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getList("diagnoses"), getList("quick_phrases")])
      .then(([dx, ph]) => {
        if (cancelled) return;
        setDiagnosisList(dx);
        setPhrases(ph);
      })
      .catch(() => {
        /* lists are optional when reading a final visit */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const notes = useVisitNotes({ visit, phrases, readOnly, onSaved: props.onVisitChange });
  const isDraft = visit.status === "draft";

  return (
    <div className="v1-screen">
      {isDraft ? (
        <p className="v1-draft-banner">
          This visit is a draft. After you finalise it, it is locked and can only be corrected with
          an addendum.
        </p>
      ) : (
        <VisitNextSteps visit={visit} canBill={canBill} />
      )}
      <div className="v1-grid">
        {isDraft ? (
          <VisitWorkColumn
            visit={visit}
            patient={patient}
            readOnly={readOnly}
            canViewClinical={canViewClinical}
            diagnosisList={diagnosisList}
            notes={notes}
            onVisitChange={props.onVisitChange}
            onToothFocus={props.onToothFocus}
          />
        ) : (
          <div className="v1-main">
            <VisitFinalView visit={visit} />
            <VisitAddenda visit={visit} canEdit={canEdit} onChanged={props.onVisitChange} />
          </div>
        )}
        <aside className="v1-side" aria-label="Prescription and context">
          <section className="card v1-card" aria-label="Prescription">
            <h2 className="v1-label">Prescription</h2>
            <VisitMedicinesPanel
              visitId={visit.id}
              patientId={patient.id}
              canWrite={canWriteRx}
              compact
              onStatusChange={setRxStatus}
            />
          </section>
          <VisitContextPanel patientId={patient.id} currentVisitId={visit.id} recent={recent} />
        </aside>
      </div>
      {isDraft && canEdit ? (
        <VisitStickyBar
          visit={visit}
          saveStatus={notes.status}
          rxStatus={rxStatus}
          onFinalised={props.onVisitChange}
        />
      ) : null}
    </div>
  );
}
