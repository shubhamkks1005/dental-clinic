import type { FdiTooth, ListItem, ToothSurface } from "@clinic/shared";
import { useState } from "react";
import { VisitChartPanel } from "../chart";
import type { PatientDetail } from "../patients";
import type { VisitSummary } from "./api";
import { DiagnosisChips } from "./DiagnosisChips";
import { NextVisitChips } from "./NextVisitChips";
import { ProcedureChips } from "./ProcedureChips";
import type { useVisitNotes } from "./useVisitNotes";
import { VisitConflictBanner } from "./VisitConflictBanner";
import { VisitMoreNotes } from "./VisitMoreNotes";
import { VisitNoteField } from "./VisitNoteField";
import type { ChartSelection } from "./VisitProcedures";

type Props = {
  visit: VisitSummary;
  patient: PatientDetail;
  readOnly: boolean;
  canViewClinical: boolean;
  diagnosisList: ListItem[];
  notes: ReturnType<typeof useVisitNotes>;
  onVisitChange: (visit: VisitSummary) => void;
  onToothFocus: (tooth: FdiTooth | null) => void;
};

/** Left column of a draft visit, top to bottom in the order the doctor works (Visit.dc.html). */
export function VisitWorkColumn({
  visit,
  patient,
  readOnly,
  canViewClinical,
  diagnosisList,
  notes,
  onVisitChange,
  onToothFocus,
}: Props) {
  const [selection, setSelection] = useState<ChartSelection | null>(null);
  const { form, status, setField, setPhrase } = notes;

  function onFocusChange(tooth: FdiTooth, surface: ToothSurface) {
    setSelection((prev) => {
      let next: ChartSelection;
      if (!prev || prev.tooth !== tooth) next = { tooth, surfaces: [surface] };
      else if (prev.surfaces.includes(surface)) {
        const surfaces = prev.surfaces.filter((s) => s !== surface);
        next = { tooth, surfaces: surfaces.length > 0 ? surfaces : [surface] };
      } else next = { tooth, surfaces: [...prev.surfaces, surface] };
      onToothFocus(next.tooth);
      return next;
    });
  }

  return (
    <div className="v1-main">
      {status === "conflict" ? <VisitConflictBanner form={form} /> : null}
      {canViewClinical ? (
        <section className="card v1-card v1-chart" aria-label="Tooth chart">
          <VisitChartPanel
            patientId={patient.id}
            visitId={visit.id}
            canEdit={!readOnly}
            dateOfBirth={patient.dateOfBirth}
            ageYearsAtReg={patient.ageYearsAtReg}
            registeredOn={patient.createdAt.slice(0, 10)}
            onFocusChange={onFocusChange}
          />
        </section>
      ) : null}
      <section className="card v1-card v1-stack" aria-label="Visit notes">
        <div className="v1-two">
          <VisitNoteField
            label="Complaint"
            value={form.chiefComplaint}
            readOnly={readOnly}
            onChange={(v) => setPhrase("chiefComplaint", v)}
          />
          <VisitNoteField
            label="Findings"
            value={form.examNote}
            readOnly={readOnly}
            onChange={(v) => setPhrase("examNote", v)}
          />
        </div>
        <ProcedureChips
          visitId={visit.id}
          procedures={visit.procedures}
          selection={selection}
          readOnly={readOnly}
          onAdded={(row) => onVisitChange({ ...visit, procedures: [...visit.procedures, row] })}
        />
        <div className="v1-two">
          <DiagnosisChips
            visitId={visit.id}
            diagnoses={visit.diagnoses}
            diagnosisList={diagnosisList}
            readOnly={readOnly}
            onAdded={(row) => onVisitChange({ ...visit, diagnoses: [...visit.diagnoses, row] })}
          />
          <NextVisitChips
            value={form.nextVisitNote}
            readOnly={readOnly}
            onChange={(v) => setField("nextVisitNote", v)}
          />
        </div>
        <VisitNoteField
          label="Advice"
          rows={2}
          value={form.advice}
          readOnly={readOnly}
          onChange={(v) => setPhrase("advice", v)}
        />
        <VisitMoreNotes form={form} readOnly={readOnly} setField={setField} setPhrase={setPhrase} />
      </section>
    </div>
  );
}
