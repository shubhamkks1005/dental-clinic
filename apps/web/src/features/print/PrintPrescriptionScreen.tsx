import { MEDICINE_TIMING_LABEL, type MedicineTiming } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { getPrescription, type PrescriptionDto } from "../prescriptions";
import { getPatient } from "../patients";
import { clinicHeaderFromSettings, clinicRegistrationMissing } from "./clinic-header";
import { PrescriptionFooter } from "./PrescriptionSample";
import "./prescription.css";
import "./print-screen.css";

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
            {rx.rxNo ?? "No number"} · {rx.status}
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
          footer={<PrescriptionFooter doctorName={clinic.doctorName} />}
        >
          <dl className="rx-patient">
            <div>
              <dt>Patient</dt>
              <dd>{patientName}</dd>
            </div>
            <div>
              <dt>Patient no.</dt>
              <dd className="rx-strong">{patientCode}</dd>
            </div>
            <div>
              <dt>Rx no.</dt>
              <dd>{rx.rxNo}</dd>
            </div>
            {rx.weightKg != null && (
              <div>
                <dt>Weight</dt>
                <dd>{rx.weightKg} kg</dd>
              </div>
            )}
          </dl>
          <section>
            <p className="rx-mark">Rx</p>
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
                {rx.items.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{item.genericName}</strong>
                      <span className="rx-note">
                        {item.strength} · {item.form}
                        {item.instruction ? ` · ${item.instruction}` : ""}
                        {" · "}
                        {MEDICINE_TIMING_LABEL[item.timing as MedicineTiming] ?? item.timing}
                      </span>
                    </td>
                    <td>{item.dose}</td>
                    <td>{item.frequency}</td>
                    <td>{item.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {rx.advice && (
            <section className="rx-advice">
              <h3 className="rx-label">Advice</h3>
              <p>{rx.advice}</p>
            </section>
          )}
          {rx.followUpOn && (
            <p>
              <strong>Next visit:</strong> {rx.followUpOn}
            </p>
          )}
          {rx.status === "revised" && <p className="rx-note">Revised prescription</p>}
        </PrintLayout>
      </div>
    </main>
  );
}
