import { billStatusKey, formatDate } from "@clinic/shared";
import { Link } from "react-router";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { StatusLabel } from "../../ui/StatusLabel";
import type { BillDto } from "./api";

// Bill header (Bill.dc.html): path, number and status, then the patient and the date.
export function BillHeader({
  bill,
  patient,
}: {
  bill: BillDto;
  patient: { fullName: string; code: string } | null;
}) {
  return (
    <header className="bill-head">
      <nav aria-label="Path" className="bill-path">
        <Link to="/app/billing">Billing</Link>
        <span aria-hidden="true">/</span>
        <Link to="/app/billing?tab=bills">Bills</Link>
      </nav>
      <div className="bill-head-row">
        <div className="bill-head-text">
          <div className="bill-title">
            <h1>{bill.billNo ? `Bill ${bill.billNo}` : "Draft bill"}</h1>
            <StatusLabel
              kind="bill"
              value={billStatusKey(bill.status, bill.totalPaise, bill.paidPaise ?? 0)}
            />
          </div>
          <p className="bill-who">
            {patient ? (
              <>
                <Link to={`/app/patients/${bill.patientId}?tab=billing`}>{patient.fullName}</Link>
                <PatientNoChip patientNo={patient.code} />
              </>
            ) : null}
            <span className="muted">{formatDate(bill.billOn)}</span>
          </p>
        </div>
        {bill.status === "issued" ? (
          <Link className="btn" to={`/app/print/bill/${bill.id}`} target="_blank" rel="noreferrer">
            Print bill
          </Link>
        ) : null}
      </div>
    </header>
  );
}
