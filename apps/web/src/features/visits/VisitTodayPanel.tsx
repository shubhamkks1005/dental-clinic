import type { ListItem } from "@clinic/shared";
import { useEffect, useState } from "react";
import { getList } from "../lists";
import type { VisitDiagnosis, VisitSummary } from "./api";
import { VisitDiagnoses } from "./VisitDiagnoses";
import { VisitNotesForm } from "./VisitNotesForm";

type Props = {
  visit: VisitSummary;
  canEdit: boolean;
  onVisitChange: (visit: VisitSummary) => void;
};

/** 3.5.3 Today's visit tab: notes + diagnoses (S05). */
export function VisitTodayPanel({ visit, canEdit, onVisitChange }: Props) {
  const readOnly = !canEdit || visit.status !== "draft";
  const [diagnoses, setDiagnoses] = useState(visit.diagnoses);
  const [diagnosisList, setDiagnosisList] = useState<ListItem[]>([]);
  const [phrases, setPhrases] = useState<ListItem[]>([]);

  useEffect(() => {
    setDiagnoses(visit.diagnoses);
  }, [visit]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getList("diagnoses"), getList("quick_phrases")])
      .then(([dx, ph]) => {
        if (!cancelled) {
          setDiagnosisList(dx);
          setPhrases(ph);
        }
      })
      .catch(() => {
        /* lists optional for reading a final visit */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onSaved(next: VisitSummary) {
    setDiagnoses(next.diagnoses);
    onVisitChange(next);
  }

  function onDiagnosisAdded(row: VisitDiagnosis) {
    const next = [...diagnoses, row];
    setDiagnoses(next);
    onVisitChange({ ...visit, diagnoses: next });
  }

  return (
    <div className="visit-today">
      <VisitNotesForm visit={visit} phrases={phrases} readOnly={readOnly} onSaved={onSaved} />
      <VisitDiagnoses
        visitId={visit.id}
        diagnoses={diagnoses}
        diagnosisList={diagnosisList}
        readOnly={readOnly}
        onAdded={onDiagnosisAdded}
      />
    </div>
  );
}
