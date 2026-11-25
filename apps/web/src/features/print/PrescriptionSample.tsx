import { displayMobile, formatDisplayDate } from "@clinic/shared";
import type { SampleRx } from "./sample-print-data";

// The body of the S13 prescription with sample data, to check the print framework (1.4.8).
// The real prescription (Phase 4) reuses this layout with saved data.
export function PrescriptionSample({ rx }: { rx: SampleRx }) {
  return (
    <>
      <dl className="rx-patient">
        <Item label="Patient" value={rx.patient} />
        <Item label="Age, gender" value={rx.ageGender} />
        <Item label="Patient no." value={rx.patientNo} strong />
        <Item label="Mobile" value={`+91 ${displayMobile(rx.mobile)}`} />
        <Item label="Date" value={formatDisplayDate(rx.date)} />
        <Item label="Visit" value={rx.visit} />
      </dl>

      <div className="rx-two">
        <section>
          <h3 className="rx-label">Complaint</h3>
          <p>{rx.complaint}</p>
        </section>
        <section>
          <h3 className="rx-label">Diagnosis</h3>
          <p>{rx.diagnosis}</p>
        </section>
      </div>

      <section>
        <p className="rx-mark">Rx</p>
        <table className="rx-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Frequency</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {rx.medicines.map((m, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  <strong>{m.name}</strong>
                  <span className="rx-note">{m.note}</span>
                </td>
                <td>{m.frequency}</td>
                <td>{m.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rx-advice">
        <h3 className="rx-label">Advice</h3>
        <ul>
          {rx.advice.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <p>
        <strong>Next visit:</strong> {rx.nextVisit}
      </p>
    </>
  );
}

function Item({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={strong ? "rx-strong" : undefined}>{value}</dd>
    </div>
  );
}

export function PrescriptionFooter({
  doctorName,
  qr = null,
}: {
  doctorName: string;
  /** The doctor's QR picture (data URL), printed next to the signature. */
  qr?: string | null;
}) {
  return (
    <>
      {qr && <img className="rx-qr" src={qr} alt="QR" />}
      <p>
        This prescription is computer generated. Please tell the clinic if anything needs
        correction.
      </p>
      <p className="rx-sign">{doctorName}</p>
    </>
  );
}
