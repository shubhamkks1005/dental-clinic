import { formatRupees, istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import {
  listPatientBills,
  listPatientPayments,
  type PatientBillRow,
  type PatientPaymentRow,
} from "../billing/api";
import { getPatient } from "../patients/api";
import { clinicHeaderFromSettings } from "./clinic-header";
import "./day-list-print.css";
import "./print-screen.css";

/** 5.3.3 patient account statement (A4). Charges, payments, balance. */
export function PrintStatementScreen() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<{ code: string; fullName: string } | null>(null);
  const [bills, setBills] = useState<PatientBillRow[]>([]);
  const [payments, setPayments] = useState<PatientPaymentRow[]>([]);
  const [due, setDue] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    (async () => {
      try {
        const [p, account, pays, settings] = await Promise.all([
          getPatient(patientId),
          listPatientBills(patientId),
          listPatientPayments(patientId),
          api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
        ]);
        if (cancelled) return;
        setPatient({ code: p.code, fullName: p.fullName });
        setBills(account.bills);
        setDue(account.outstandingDuePaise);
        setAdvance(account.advancePaise);
        setPayments(pays);
        setClinic(clinicHeaderFromSettings(settings.settings));
        document.title = printTitle("Statement", p.code, new Date().toISOString());
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (problem) {
    return (
      <p className="error-text">
        {problem}{" "}
        <Link to={patientId ? `/app/patients/${patientId}?tab=billing` : "/app"}>Back</Link>
      </p>
    );
  }
  if (!patient || !patientId) return <p className="muted">Loading…</p>;

  return (
    <div className="print-screen">
      <div className="print-screen-toolbar no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          Print
        </button>
        <Link to={`/app/patients/${patientId}?tab=billing`} className="btn secondary">
          Back
        </Link>
      </div>
      <PrintLayout size="A4" header="print" clinic={clinic}>
        <h1 className="title-sm">Account statement</h1>
        <p>
          {patient.fullName} · {patient.code} · {istDate(new Date())}
        </p>
        <p>
          Outstanding: <strong>{formatRupees(due)}</strong>
          {advance > 0 ? <> · Advance: {formatRupees(advance)}</> : null}
        </p>

        <h2 className="title-sm">Charges</h2>
        <table className="day-list-print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Bill</th>
              <th>Status</th>
              <th>Total</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id}>
                <td>{b.billOn}</td>
                <td>{b.billNo ?? "Draft"}</td>
                <td>{b.status}</td>
                <td>{formatRupees(b.totalPaise)}</td>
                <td>{b.duePaise > 0 ? formatRupees(b.duePaise) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="title-sm">Payments</h2>
        <table className="day-list-print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Receipt</th>
              <th>Mode</th>
              <th>Amount</th>
              <th>Refunded</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.dayLocal}</td>
                <td>{p.receiptNo ?? "—"}</td>
                <td>
                  {p.mode}
                  {p.splitMode && p.splitPaise != null
                    ? ` + ${p.splitMode} ${formatRupees(p.splitPaise)}`
                    : ""}
                </td>
                <td>{formatRupees(p.amountPaise)}</td>
                <td>{p.refundedPaise > 0 ? formatRupees(p.refundedPaise) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintLayout>
    </div>
  );
}
