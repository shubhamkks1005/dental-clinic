import type { useVisitPrescription } from "./useVisitPrescription";

type Props = {
  rx: ReturnType<typeof useVisitPrescription>;
  locked: boolean;
  busy: boolean;
};

/** Prescription advice, follow-up date and weight. Each saves when the field loses focus. */
export function RxMetaFields({ rx, locked, busy }: Props) {
  return (
    <div className="rx-meta">
      <label>
        Advice
        <textarea
          value={rx.advice}
          disabled={locked || busy}
          rows={2}
          onChange={(e) => rx.setAdvice(e.target.value)}
          onBlur={() => void rx.saveMeta()}
        />
      </label>
      <label>
        Follow-up date
        <input
          type="date"
          value={rx.followUpOn}
          disabled={locked || busy}
          onChange={(e) => rx.setFollowUpOn(e.target.value)}
          onBlur={() => void rx.saveMeta()}
        />
      </label>
      <label>
        Weight (kg)
        <input
          inputMode="numeric"
          value={rx.weightKg}
          disabled={locked || busy}
          onChange={(e) => rx.setWeightKg(e.target.value)}
          onBlur={() => void rx.saveMeta()}
        />
      </label>
    </div>
  );
}
