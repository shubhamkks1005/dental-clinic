import type { FdiTooth, ToothSurface } from "@clinic/shared";
import { useEffect, useState } from "react";
import { VisitChartPanel } from "../chart";
import type { PatientDetail } from "../patients";
import type { VisitProcedure, VisitSummary } from "./api";
import { VisitProcedures, type ChartSelection } from "./VisitProcedures";

type Props = {
  visit: VisitSummary;
  patient: PatientDetail;
  canEdit: boolean;
  onVisitChange: (visit: VisitSummary) => void;
};

/** 3.5.4: chart + procedures on the visit Chart tab (S05). */
export function VisitChartTab({ visit, patient, canEdit, onVisitChange }: Props) {
  const readOnly = !canEdit || visit.status !== "draft";
  const [selection, setSelection] = useState<ChartSelection | null>(null);
  const [procedures, setProcedures] = useState(visit.procedures);

  useEffect(() => {
    setProcedures(visit.procedures);
  }, [visit]);

  function onFocusChange(tooth: FdiTooth, surface: ToothSurface) {
    setSelection((prev) => {
      if (!prev || prev.tooth !== tooth) return { tooth, surfaces: [surface] };
      if (prev.surfaces.includes(surface)) {
        const next = prev.surfaces.filter((s) => s !== surface);
        return { tooth, surfaces: next.length > 0 ? next : [surface] };
      }
      return { tooth, surfaces: [...prev.surfaces, surface] };
    });
  }

  function onAdded(row: VisitProcedure) {
    const next = [...procedures, row];
    setProcedures(next);
    onVisitChange({ ...visit, procedures: next });
  }

  return (
    <div className="visit-chart-tab">
      <VisitChartPanel
        patientId={patient.id}
        visitId={visit.id}
        canEdit={canEdit && visit.status === "draft"}
        dateOfBirth={patient.dateOfBirth}
        ageYearsAtReg={patient.ageYearsAtReg}
        registeredOn={patient.createdAt.slice(0, 10)}
        onFocusChange={onFocusChange}
      />
      <VisitProcedures
        visitId={visit.id}
        procedures={procedures}
        selection={selection}
        readOnly={readOnly}
        onAdded={onAdded}
      />
    </div>
  );
}
