import {
  amountInWords,
  formatDisplayDate,
  formatRupees,
  istDate,
  registrationMissing,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { getPatient } from "../patients/api";
import { clinicHeaderFromSettings } from "./clinic-header";
import "./print-screen.css";

type PaymentDto = {
  id: string;
  patientId: string;
  amountPaise: number;
  mode: string;
  splitMode: string | null;
  splitPaise: number | null;
  reference: string;
  receiptNo: string | null;
  dayLocal: string;
  notes: string;
};

/** 5.3.11 payment receipt print; Duplicate copy on reprint. */
export function PrintReceiptScreen() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentDto | null>(null);
  const [patient, setPatient] = useState<{ code: string; fullName: string } | null>(null);
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [duplicate, setDuplicate] = useState(false);
  const [dupDate, setDupDate] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [payRes, settings] = await Promise.all([
          api<{ payment: PaymentDto }>(`/api/staff/payments/${encodeURIComponent(id)}`),
          api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
        ]);
        if (cancelled) return;
        const p = await getPatient(payRes.payment.patientId);
        if (cancelled) return;
        setPayment(payRes.payment);
        setPatient({ code: p.code, fullName: p.fullName });
        setClinic(clinicHeaderFromSettings(settings.settings));
        const preview = await api<{ isReprint: boolean }>(
          `/api/staff/print-log/preview?kind=receipt&id=${encodeURIComponent(id)}`,
        ).catch(() => ({ isReprint: false }));
        setDuplicate(preview.isReprint);
        if (preview.isReprint) setDupDate(istDate(new Date()));
        document.title = printTitle(
          "Receipt",
          payRes.payment.receiptNo ?? payRes.payment.id,
          new Date().toISOString(),
        );
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onPrint() {
    if (!payment) return;
    try {
      const recorded = await api<{ isReprint: boolean }>("/api/staff/print-log", {
        method: "POST",
        body: JSON.stringify({ documentKind: "receipt", documentId: payment.id }),
      });
      setDuplicate(recorded.isReprint);
      if (recorded.isReprint) setDupDate(istDate(new Date()));
      window.print();
    } catch (err) {
      setProblem(problemText(err));
    }
  }

  if (problem) {
    return (
      <p className="error-text">
        {problem} <Link to="/app/billing">Back</Link>
      </p>
    );
  }
  if (!payment || !patient) return <p className="muted">Loading…</p>;

  return (
    <div className="print-screen">
      <div className="print-screen-toolbar no-print">
        <button type="button" className="btn" onClick={() => void onPrint()}>
          Print
        </button>
        <Link to={`/app/patients/${payment.patientId}?tab=billing`} className="btn secondary">
          Back
        </Link>
      </div>
      <PrintLayout
        size="A5"
        header="print"
        clinic={clinic}
        duplicate={duplicate}
        duplicateDate={dupDate}
      >
        <h1 className="title-sm">Receipt {payment.receiptNo ?? ""}</h1>
        <p>
          {patient.fullName} · {patient.code} · {formatDisplayDate(payment.dayLocal)}
        </p>
        {registrationMissing(clinic.registrationNo) ? null : (
          <p className="muted small">Reg. no. {clinic.registrationNo}</p>
        )}
        <p>
          <strong>Amount {formatRupees(payment.amountPaise)}</strong>
        </p>
        <p className="muted small">{amountInWords(payment.amountPaise)}</p>
        <p>
          Mode: {payment.mode}
          {payment.splitMode && payment.splitPaise != null
            ? ` + ${payment.splitMode} ${formatRupees(payment.splitPaise)}`
            : ""}
        </p>
        {payment.reference ? <p>Reference: {payment.reference}</p> : null}
        {payment.notes ? <p className="muted small">{payment.notes}</p> : null}
        <p className="muted small">This is not a GST invoice (gst_mode off — DRAFT accountant).</p>
      </PrintLayout>
    </div>
  );
}
