import { statusWord } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { getPrescription, type PrescriptionDto } from "../prescriptions";
import { getPatient } from "../patients";
import { getQrImage } from "../settings/api";
import { clinicHeaderFromSettings, clinicRegistrationMissing } from "./clinic-header";
import { PrescriptionFooter } from "./PrescriptionSample";
import { PrescriptionBody, rxItemNote, type RxBodyData } from "./PrescriptionBody";
import "./prescription.css";
import "./print-screen.css";

function bodyData(rx: PrescriptionDto, patientName: string, patientCode: string): RxBodyData {
  return {
    patientName,
    patientCode,
    rxNo: rx.rxNo,
    weightKg: rx.weightKg,
    items: rx.items.map((item) => ({
      key: item.id,
      name: item.genericName,
      note: rxItemNote(item),
      dose: item.dose,
      frequency: item.frequency,
      days: item.days,
    })),
    advice: rx.advice ?? "",
    followUpOn: rx.followUpOn ?? "",
    revised: rx.status === "revised",
  };
}

/** 4.3.3 real prescription print (S13). English, A5 default; duplicate mark on reprint. */
export function PrintPrescriptionScreen() {
  const { id } = useParams<{ id: string }>();
  const [rx, setRx] = useState<PrescriptionDto | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [regMissing, setRegMissing] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [dupDate, setDupDate] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    getQrImage()
      .then((r) => setQr(r.value))
      .catch(() => setQr(null));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [prescription, settings] = await Promise.all([
          getPrescription(id),
          api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
        ]);
        if (cancelled) return;
        if (prescription.status === "draft") {
          setProblem("Issue this prescription before printing.");
          return;
        }
        const patient = await getPatient(prescription.patientId);
        if (cancelled) return;
        setRx(prescription);
        setPatientName(patient.fullName);
        setPatientCode(patient.code);
        const header = clinicHeaderFromSettings(settings.settings);
        setClinic(header);
        setRegMissing(clinicRegistrationMissing(settings.settings));
        const preview = await api<{ isReprint: boolean }>(
          `/api/staff/print-log/preview?kind=prescription&id=${encodeURIComponent(id)}`,
        ).catch(() => ({ isReprint: false }));
        setDuplicate(preview.isReprint);
        if (preview.isReprint) setDupDate(new Date().toISOString().slice(0, 10));
        document.title = printTitle("Prescription", patient.code, new Date().toISOString());
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onPrint() {
    if (!rx || regMissing) return;
    try {
      const recorded = await api<{ isReprint: boolean }>("/api/staff/print-log", {
        method: "POST",
        body: {
          documentKind: "prescription",
          documentId: rx.id,
          documentVersion: rx.version,
        },
      });
      setDuplicate(recorded.isReprint);
      if (recorded.isReprint) setDupDate(new Date().toISOString().slice(0, 10));
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
  if (!rx) return <main className="print-screen muted">Loading…</main>;

  return (
    <main className="print-screen">
      <div className="card print-toolbar">
        <div>
          <h1>Prescription</h1>
          <p className="muted">
            {rx.rxNo ?? "No number"} · {statusWord("visit", rx.status).label}
          </p>
        </div>
        {regMissing && (
          <p className="notice notice-error" role="alert">
            Set the doctor registration number in Settings before printing.
          </p>
        )}
        <div className="print-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={regMissing}
            onClick={() => void onPrint()}
          >
            Print
          </button>
          <Link to="/app" className="btn">
            Back
          </Link>
        </div>
      </div>
      <div className="print-scroll">
        <PrintLayout
          size="A5"
          header="print"
          clinic={clinic}
          duplicate={duplicate}
          duplicateDate={dupDate}
          footer={<PrescriptionFooter doctorName={clinic.doctorName} qr={qr} />}
        >
          <PrescriptionBody data={bodyData(rx, patientName, patientCode)} />
        </PrintLayout>
      </div>
    </main>
  );
}
