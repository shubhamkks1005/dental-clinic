import {
  MEDICAL_HISTORY_SECTION_LABEL,
  MEDICAL_HISTORY_SECTIONS,
  type MedicalAnswer,
  type MedicalHistoryItem,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getList } from "../lists";
import { saveMedicalHistory } from "./api";
import {
  allergyRows,
  answerMap,
  buildSaveItems,
  medicinesNote,
  rowsFromHistoryItems,
  type ChecklistRow,
} from "./checklist";
import { MhQuestionRow } from "./MhQuestionRow";
import "./medical-history.css";
import { Textarea } from "../../ui/form";

type Props = {
  patientId: string;
  gender: "female" | "male" | "other";
  existing: MedicalHistoryItem[] | undefined;
  onSaved: () => void;
  onCancel: () => void;
};

export function MedicalHistoryForm({ patientId, gender, existing, onSaved, onCancel }: Props) {
  const [rows, setRows] = useState<ChecklistRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, MedicalAnswer>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [medicinesText, setMedicinesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getList("medical_history_items"), getList("allergens")])
      .then(([historyItems, allergens]) => {
        if (cancelled) return;
        const checklist = [...rowsFromHistoryItems(historyItems), ...allergyRows(allergens)];
        setRows(checklist);
        const prev = answerMap(existing);
        const nextAnswers: Record<string, MedicalAnswer> = {};
        const nextNotes: Record<string, string> = {};
        for (const row of checklist) {
          nextAnswers[row.code] = prev.get(row.code)?.answer ?? "unknown";
          nextNotes[row.code] = prev.get(row.code)?.note ?? "";
        }
        setAnswers(nextAnswers);
        setNotes(nextNotes);
        setMedicinesText(medicinesNote(existing));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Could not load the checklist. Check the connection, then try again.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [existing]);

  const visibleSections = MEDICAL_HISTORY_SECTIONS.filter(
    (s) => s !== "pregnancy" || gender === "female",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rows || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveMedicalHistory(patientId, buildSaveItems(rows, answers, notes, medicinesText));
      onSaved();
    } catch (err: unknown) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Could not save medical history. Check the connection, then try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <p className="notice notice-error" role="alert">
        {loadError}
      </p>
    );
  }
  if (!rows) return <p className="muted">Loading checklist…</p>;

  return (
    <form className="mh-form" onSubmit={onSubmit}>
      <p className="muted mh-lead">
        Answer each question. Yes answers with an alert label appear on the patient profile.
      </p>
      {visibleSections.map((section) => {
        const sectionRows = rows.filter((r) => r.section === section);
        if (sectionRows.length === 0 && section !== "medicines") return null;
        return (
          <fieldset key={section} className="mh-section">
            <legend>{MEDICAL_HISTORY_SECTION_LABEL[section]}</legend>
            {sectionRows.map((row) => (
              <MhQuestionRow
                key={row.code}
                row={row}
                answer={answers[row.code] ?? "unknown"}
                note={notes[row.code] ?? ""}
                onAnswer={(a) => setAnswers((prev) => ({ ...prev, [row.code]: a }))}
                onNote={(n) => setNotes((prev) => ({ ...prev, [row.code]: n }))}
              />
            ))}
            {section === "medicines" && (
              <label className="mh-medicines">
                Other medicines
                <Textarea
                  value={medicinesText}
                  rows={2}
                  placeholder="List any other medicines"
                  onChange={(e) => setMedicinesText(e.target.value)}
                />
              </label>
            )}
          </fieldset>
        );
      })}
      {saveError && (
        <p className="notice notice-error" role="alert">
          {saveError}
        </p>
      )}
      <div className="mh-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save medical history"}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
