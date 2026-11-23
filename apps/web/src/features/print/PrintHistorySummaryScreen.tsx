import { formatDisplayDate, istDate, statusWord } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { clinicHeaderFromSettings } from "./clinic-header";
import "./day-list-print.css";
import "./print-screen.css";

type PrintSummary = {
  patient: {
    code: string;
    fullName: string;
    gender: string;
    ageLabel: string;
    mobile: string | null;
  };
  allergies: string[];
  visits: Array<{
    id: string;
    visitDateLocal: string;
    status: string;
    chiefComplaint: string | null;
    diagnoses: string[];
    doctorName: string | null;
  }>;
  treatments: Array<{
    id: string;
    createdOn: string;
    procedureLabel: string;
    toothFdi: number | null;
    status: string;
    estimateLabel: string;
  }>;
};

/** 6.7.2: A4 patient history summary (doctor only; S04/S17 → print). */
export function PrintHistorySummaryScreen() {
  const { patientId } = useParams<{ patientId: string }>();
  const [summary, setSummary] = useState<PrintSummary | null>(null);
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [duplicate, setDuplicate] = useState(false);
  const [dupDate, setDupDate] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    (async () => {
      try {
        const [data, settings] = await Promise.all([
          api<{ summary: PrintSummary }>(
            `/api/staff/patients/${encodeURIComponent(patientId)}/history/print-summary`,
          ),
          api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
        ]);
        if (cancelled) return;
        setSummary(data.summary);
        setClinic(clinicHeaderFromSettings(settings.settings));
        const preview = await api<{ isReprint: boolean }>(
          `/api/staff/print-log/preview?kind=history_summary&id=${encodeURIComponent(patientId)}`,
        ).catch(() => ({ isReprint: false }));
        setDuplicate(preview.isReprint);
        if (preview.isReprint) setDupDate(istDate(new Date()));
        document.title = printTitle("History", data.summary.patient.code, new Date().toISOString());
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  async function onPrint() {
    if (!patientId || !summary) return;
    try {
      const recorded = await api<{ isReprint: boolean }>("/api/staff/print-log", {
        method: "POST",
        body: {
          documentKind: "history_summary",
          documentId: patientId,
        },
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
        {problem}{" "}
        <Link to={patientId ? `/app/patients/${patientId}?tab=history` : "/app"}>Back</Link>
      </p>
    );
  }
  if (!summary || !patientId) return <p className="muted">Loading…</p>;

  const p = summary.patient;

  return (
    <div className="print-screen">
      <div className="print-screen-toolbar no-print">
        <button type="button" className="btn" onClick={() => void onPrint()}>
          Print
        </button>
        <Link to={`/app/patients/${patientId}?tab=history`} className="btn secondary">
          Back
        </Link>
      </div>
      <PrintLayout size="A4" header="print" clinic={clinic}>
        {duplicate ? <p className="muted">Duplicate copy · {dupDate}</p> : null}
        <h1 className="title-sm">Patient history summary</h1>
        <p>
          {p.fullName} · {p.code} · {p.gender} · {p.ageLabel}
          {p.mobile ? ` · ${p.mobile}` : ""}
        </p>
        <p>
          <strong>Allergies / alerts:</strong>{" "}
          {summary.allergies.length > 0 ? summary.allergies.join(", ") : "None on file"}
        </p>

        <h2 className="title-sm">Visits</h2>
        <table className="day-list-print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Complaint / diagnosis</th>
              <th>Doctor</th>
            </tr>
          </thead>
          <tbody>
            {summary.visits.length === 0 ? (
              <tr>
                <td colSpan={4}>No visits</td>
              </tr>
            ) : (
              summary.visits.map((v) => (
                <tr key={v.id}>
                  <td>{formatDisplayDate(v.visitDateLocal)}</td>
                  <td>{statusWord("visit", v.status).label}</td>
                  <td>
                    {[v.chiefComplaint, v.diagnoses.join("; ")].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td>{v.doctorName ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h2 className="title-sm">Treatments</h2>
        <table className="day-list-print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Procedure</th>
              <th>Tooth</th>
              <th>Status</th>
              <th>Estimate</th>
            </tr>
          </thead>
          <tbody>
            {summary.treatments.length === 0 ? (
              <tr>
                <td colSpan={5}>No treatments</td>
              </tr>
            ) : (
              summary.treatments.map((r) => (
                <tr key={r.id}>
                  <td>{formatDisplayDate(r.createdOn)}</td>
                  <td>{r.procedureLabel}</td>
                  <td>{r.toothFdi ?? "—"}</td>
                  <td>{statusWord("visit", r.status).label}</td>
                  <td>{r.estimateLabel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PrintLayout>
    </div>
  );
}
