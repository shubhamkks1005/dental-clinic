import { MEDICAL_ANSWER_LABEL, MEDICAL_ANSWERS, type MedicalAnswer } from "@clinic/shared";
import type { ChecklistRow } from "./checklist";

type Props = {
  row: ChecklistRow;
  answer: MedicalAnswer;
  note: string;
  onAnswer: (answer: MedicalAnswer) => void;
  onNote: (note: string) => void;
};

export function MhQuestionRow({ row, answer, note, onAnswer, onNote }: Props) {
  return (
    <div className="mh-row">
      <span className="mh-label">{row.label}</span>
      <div className="mh-answers" role="group" aria-label={row.label}>
        {MEDICAL_ANSWERS.map((a) => (
          <label key={a} className="mh-answer">
            <input
              type="radio"
              name={`mh-${row.code}`}
              value={a}
              checked={answer === a}
              onChange={() => onAnswer(a)}
            />
            {MEDICAL_ANSWER_LABEL[a]}
          </label>
        ))}
      </div>
      <label className="mh-note">
        <span className="visually-hidden">Note for {row.label}</span>
        <input
          type="text"
          value={note}
          placeholder="Note (optional)"
          onChange={(e) => onNote(e.target.value)}
        />
      </label>
    </div>
  );
}
