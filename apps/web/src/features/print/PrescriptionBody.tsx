import { MEDICINE_TIMING_LABEL, type MedicineTiming } from "@clinic/shared";
import "./prescription.css";

/** The grey line under a medicine name: strength, form, instruction, timing. */
export function rxItemNote(m: {
  strength: string;
  form: string;
  instruction: string;
  timing: string;
}): string {
  const timing = MEDICINE_TIMING_LABEL[m.timing as MedicineTiming] ?? m.timing;
  return `${m.strength} · ${m.form}${m.instruction ? ` · ${m.instruction}` : ""} · ${timing}`;
}

/** One medicine row of the sheet, already in words (the print screen and the live sheet fill it). */
export type RxBodyItem = {
  key: string;
  name: string;
  note: string;
  dose: string;
  frequency: string;
  days: string;
};

export type RxBodyData = {
  patientName: string;
  patientCode: string;
  rxNo: string | null;
  weightKg?: number | null;
  items: RxBodyItem[];
  advice: string;
  followUpOn: string;
  revised?: boolean;
  /** Affected teeth with a short list of what each has (PLAN U9.3). Left out when empty. */
  problemTeeth?: { fdi: number; items: string[] }[];
};

/**
 * The body of the prescription sheet: patient block, Rx table, advice, next visit. The print
 * screen and the live sheet on the visit page both render this inside PrintLayout, so what the
 * doctor sees is what prints (PLAN U9.4).
 */
export function PrescriptionBody({ data }: { data: RxBodyData }) {
  const teeth = data.problemTeeth ?? [];
  return (
    <>
      <dl className="rx-patient">
        <div>
          <dt>Patient</dt>
          <dd>{data.patientName}</dd>
        </div>
        <div>
          <dt>Patient no.</dt>
          <dd className="rx-strong">{data.patientCode}</dd>
        </div>
        <div>
          <dt>Rx no.</dt>
          <dd>{data.rxNo ?? "—"}</dd>
        </div>
        {data.weightKg != null && (
          <div>
            <dt>Weight</dt>
            <dd>{data.weightKg} kg</dd>
          </div>
        )}
      </dl>
      {teeth.length > 0 && (
        <section>
          <h3 className="rx-label">Problem teeth</h3>
          <ul className="rx-teeth">
            {teeth.map((t) => (
              <li key={t.fdi}>
                {t.fdi}: {t.items.join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <p className="rx-mark">Rx</p>
        {data.items.length === 0 ? (
          <p className="rx-note">No medicines yet.</p>
        ) : (
          <table className="rx-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Dose</th>
                <th>Frequency</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={item.key}>
                  <td>{i + 1}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <span className="rx-note">{item.note}</span>
                  </td>
                  <td>{item.dose}</td>
                  <td>{item.frequency}</td>
                  <td>{item.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {data.advice && (
        <section className="rx-advice">
          <h3 className="rx-label">Advice</h3>
          <p>{data.advice}</p>
        </section>
      )}
      {data.followUpOn && (
        <p>
          <strong>Next visit:</strong> {data.followUpOn}
        </p>
      )}
      {data.revised && <p className="rx-note">Revised prescription</p>}
    </>
  );
}
