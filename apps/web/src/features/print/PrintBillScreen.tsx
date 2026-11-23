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
import { getBill, type BillDto } from "../billing/api";
import { getPatient } from "../patients/api";
import { clinicHeaderFromSettings } from "./clinic-header";
import "./print-screen.css";

/** 5.3.11 A4/A5 bill print: items, payments, amount in words, Duplicate on reprint. */
export function PrintBillScreen() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<(BillDto & { payments?: BillDto["payments"] }) | null>(null);
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
        const [b, settings] = await Promise.all([
          getBill(id),
          api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
        ]);
        if (cancelled) return;
        if (b.status !== "issued" && b.status !== "cancelled") {
          setProblem("Issue this bill before printing.");
          return;
        }
        const p = await getPatient(b.patientId);
        if (cancelled) return;
        setBill(b);
        setPatient({ code: p.code, fullName: p.fullName });
        setClinic(clinicHeaderFromSettings(settings.settings));
        const preview = await api<{ isReprint: boolean }>(
          `/api/staff/print-log/preview?kind=bill&id=${encodeURIComponent(id)}`,
        ).catch(() => ({ isReprint: false }));
        setDuplicate(preview.isReprint);
        if (preview.isReprint) setDupDate(istDate(new Date()));
        document.title = printTitle("Bill", b.billNo ?? b.id, new Date().toISOString());
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onPrint() {
    if (!bill) return;
    try {
      const recorded = await api<{ isReprint: boolean }>("/api/staff/print-log", {
        method: "POST",
        body: JSON.stringify({
          documentKind: "bill",
          documentId: bill.id,
          documentVersion: bill.version,
        }),
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
  if (!bill || !patient) return <p className="muted">Loading…</p>;

  const paid = (bill.payments ?? []).reduce((s, p) => s + p.amountPaise, 0);
  const due = Math.max(0, bill.totalPaise - paid);

  return (
    <div className="print-screen">
      <div className="print-screen-toolbar no-print">
        <button type="button" className="btn" onClick={() => void onPrint()}>
          Print
        </button>
        <Link to={`/app/bills/${bill.id}`} className="btn secondary">
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
        <h1 className="title-sm">Bill {bill.billNo ?? ""}</h1>
        <p>
          {patient.fullName} · {patient.code} · {formatDisplayDate(bill.billOn)}
        </p>
        {registrationMissing(clinic.registrationNo) ? (
          <p className="muted small">Doctor registration number missing in Settings.</p>
        ) : (
          <p className="muted small">Reg. no. {clinic.registrationNo}</p>
        )}
        <ul>
          {bill.items.map((item) => (
            <li key={item.id}>
              {item.procedureLabel}
              {item.toothFdi != null ? ` · tooth ${item.toothFdi}` : ""}
              {item.qty > 1 ? ` ×${item.qty}` : ""} — {formatRupees(item.lineTotalPaise)}
            </li>
          ))}
        </ul>
        <p>
          Subtotal {formatRupees(bill.subtotalPaise)}
          {bill.discountPaise > 0 ? ` · Discount ${formatRupees(bill.discountPaise)}` : ""}
          {bill.taxPaise > 0 ? ` · Tax ${formatRupees(bill.taxPaise)}` : ""}
        </p>
        <p>
          <strong>Total {formatRupees(bill.totalPaise)}</strong>
        </p>
        <p className="muted small">{amountInWords(bill.totalPaise)}</p>
        {(bill.payments ?? []).length > 0 ? (
          <div>
            <p className="label">Payments</p>
            <ul>
              {(bill.payments ?? []).map((p) => (
                <li key={p.paymentId}>
                  {p.receiptNo ?? "Payment"} · {p.mode} · {formatRupees(p.amountPaise)} ·{" "}
                  {formatDisplayDate(p.dayLocal)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p>Balance due: {formatRupees(due)}</p>
        {bill.status === "cancelled" ? (
          <p>Cancelled{bill.cancelReason ? `: ${bill.cancelReason}` : ""}</p>
        ) : null}
        <p className="muted small">This is not a GST invoice (gst_mode off — DRAFT accountant).</p>
      </PrintLayout>
    </div>
  );
}
