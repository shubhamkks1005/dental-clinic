import { displayAge, estimatePlanVersion, estimateValidUntil, istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { getPatient } from "../patients";
import { listPlanItems, type PlanItem } from "../plan";
import { clinicHeaderFromSettings } from "./clinic-header";
import { EstimateSheetBody } from "./EstimateSheetBody";
import "./estimate-print.css";
import "./print-screen.css";

/** 4.4.1 treatment estimate sheet (A4). Live plan; each print goes to print_log. */
export function PrintEstimateScreen() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patientName, setPatientName] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [items, setItems] = useState<PlanItem[] | null>(null);
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [duplicate, setDuplicate] = useState(false);
  const [dupDate, setDupDate] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    (async () => {
      try {
        const [patient, plan, settings] = await Promise.all([
          getPatient(patientId),
          listPlanItems(patientId),
          api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
        ]);
        if (cancelled) return;
        setPatientName(patient.fullName);
        setPatientCode(patient.code);
        setPatientAge(
          displayAge(
            {
              dateOfBirth: patient.dateOfBirth,
              ageYearsAtReg: patient.ageYearsAtReg,
              registeredOn: istDate(new Date(patient.createdAt)),
            },
            istDate(new Date()),
          ),
        );
        setItems(plan);
        setClinic(clinicHeaderFromSettings(settings.settings));
        const preview = await api<{ isReprint: boolean }>(
          `/api/staff/print-log/preview?kind=estimate&id=${encodeURIComponent(patientId)}`,
        ).catch(() => ({ isReprint: false }));
        setDuplicate(preview.isReprint);
        if (preview.isReprint) setDupDate(istDate(new Date()));
        document.title = printTitle("Estimate", patient.code, new Date().toISOString());
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  async function onPrint() {
    if (!patientId || !items) return;
    try {
      const recorded = await api<{ isReprint: boolean }>("/api/staff/print-log", {
        method: "POST",
        body: JSON.stringify({
          documentKind: "estimate",
          documentId: patientId,
          documentVersion: estimatePlanVersion(items),
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
      <main className="print-screen">
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
        <Link to="/app">Back</Link>
      </main>
    );
  }
  if (!items) return <main className="print-screen muted">Loading…</main>;

  const issuedOn = istDate(new Date());
  const validUntil = estimateValidUntil();

  return (
    <main className="print-screen">
      <div className="card print-toolbar">
        <div>
          <h1>Treatment estimate</h1>
          <p className="muted">
            {patientCode} · {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="print-actions">
          <button type="button" className="btn btn-primary" onClick={() => void onPrint()}>
            Print
          </button>
          <Link to="/app" className="btn">
            Back
          </Link>
        </div>
      </div>
      <div className="print-scroll">
        <PrintLayout
          size="A4"
          header="print"
          clinic={clinic}
          duplicate={duplicate}
          duplicateDate={dupDate}
          footer={
            <div className="estimate-sign">
              <p>Patient / guardian signature: ________________________ Date: __________</p>
              <p>Doctor signature: ________________________</p>
            </div>
          }
        >
          <EstimateSheetBody
            patientName={patientName}
            patientCode={patientCode}
            patientAge={patientAge}
            issuedOn={issuedOn}
            validUntil={validUntil}
            items={items}
          />
        </PrintLayout>
      </div>
    </main>
  );
}
