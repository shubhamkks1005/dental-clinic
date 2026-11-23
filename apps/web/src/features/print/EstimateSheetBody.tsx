import {
  ESTIMATE_DISCLAIMER,
  formatDisplayDate,
  statusWord,
  formatRupees,
  planPhaseLabel,
} from "@clinic/shared";
import type { PlanItem } from "../plan";

type Props = {
  patientName: string;
  patientCode: string;
  patientAge: string;
  issuedOn: string;
  validUntil: string;
  items: PlanItem[];
};

/** Inner A4 estimate content (4.4.1). */
export function EstimateSheetBody({
  patientName,
  patientCode,
  patientAge,
  issuedOn,
  validUntil,
  items,
}: Props) {
  const phases = [1, 2, 3, 4];
  const totalPaise = items.reduce((sum, i) => sum + i.estimatePaise, 0);

  return (
    <>
      <h2 className="estimate-title">Treatment estimate</h2>
      <dl className="estimate-meta">
        <div>
          <dt>Patient</dt>
          <dd>{patientName}</dd>
        </div>
        <div>
          <dt>Patient no.</dt>
          <dd>{patientCode}</dd>
        </div>
        {patientAge ? (
          <div>
            <dt>Age</dt>
            <dd>{patientAge}</dd>
          </div>
        ) : null}
        <div>
          <dt>Issued</dt>
          <dd>{formatDisplayDate(issuedOn)}</dd>
        </div>
        <div>
          <dt>Valid until</dt>
          <dd>{formatDisplayDate(validUntil)}</dd>
        </div>
      </dl>
      <p className="estimate-disclaimer">{ESTIMATE_DISCLAIMER}</p>
      {phases.map((phase) => {
        const group = items.filter((i) => i.phase === phase);
        if (group.length === 0) return null;
        const sub = group.reduce((s, i) => s + i.estimatePaise, 0);
        return (
          <section key={phase} className="estimate-phase">
            <h3>
              {phase}. {planPhaseLabel(phase)}{" "}
              <span className="estimate-subtotal">({formatRupees(sub)})</span>
            </h3>
            <table className="estimate-table">
              <thead>
                <tr>
                  <th>Procedure</th>
                  <th>Tooth</th>
                  <th>Status</th>
                  <th className="estimate-amt">Estimate</th>
                </tr>
              </thead>
              <tbody>
                {group.map((item) => (
                  <tr key={item.id}>
                    <td>{item.procedureLabel}</td>
                    <td>{item.toothFdi ?? "—"}</td>
                    <td>{statusWord("visit", item.status).label}</td>
                    <td className="estimate-amt">{formatRupees(item.estimatePaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
      {items.length === 0 ? <p className="muted">No plan items yet.</p> : null}
      <p className="estimate-total">
        Total estimate: <strong>{formatRupees(totalPaise)}</strong>
      </p>
    </>
  );
}
