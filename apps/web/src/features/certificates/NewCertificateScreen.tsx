import { displayAge, istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { getPatient } from "../patients";
import { createCertificate, finaliseCertificate } from "./api";
import "./certificates.css";
import { Select, TextInput, Textarea } from "../../ui/form";

/** 4.4.3 doctor creates then finalises a medical certificate for a patient. */
export function NewCertificateScreen() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [identificationMark, setIdentificationMark] = useState("");
  const [signMethod, setSignMethod] = useState<"signature" | "thumb">("signature");
  const [reason, setReason] = useState("");
  const [fromOn, setFromOn] = useState(istDate(new Date()));
  const [toOn, setToOn] = useState(istDate(new Date()));
  const [diagnosis, setDiagnosis] = useState("");
  const [regMissing, setRegMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    (async () => {
      try {
        const [patient, settings] = await Promise.all([
          getPatient(patientId),
          api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
        ]);
        if (cancelled) return;
        setPatientName(patient.fullName);
        setPatientAddress(patient.area ?? "");
        setPatientAge(
          displayAge(
            {
              dateOfBirth: patient.dateOfBirth,
              ageYearsAtReg: patient.ageYearsAtReg,
              registeredOn: istDate(new Date(patient.createdAt)),
            },
            istDate(new Date()),
          ) || "—",
        );
        const reg = settings.settings.find((s) => s.key === "doctor.registration_no");
        setRegMissing(!(typeof reg?.value === "string" && reg.value.trim()));
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      const draft = await createCertificate({
        patientId,
        patientName,
        patientAge,
        patientAddress,
        identificationMark,
        signMethod,
        reason,
        fromOn,
        toOn,
        diagnosis: diagnosis.trim() || null,
      });
      const final = await finaliseCertificate(draft.id, draft.version);
      navigate(`/app/print/certificate/${encodeURIComponent(final.id)}`);
    } catch (err) {
      setProblem(problemText(err));
      setBusy(false);
    }
  }

  return (
    <main className="certificates-new">
      <header className="page-header">
        <div>
          <h1>New medical certificate</h1>
          <p className="muted">Draft wording until doctor and lawyer confirm.</p>
        </div>
        <Link className="btn" to={`/app/patients/${encodeURIComponent(patientId ?? "")}`}>
          Back
        </Link>
      </header>
      {regMissing ? (
        <p className="notice notice-error" role="alert">
          Set the doctor registration number in Settings before finalising a certificate.
        </p>
      ) : null}
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      <form className="card cert-form" onSubmit={(e) => void onSubmit(e)}>
        <label className="field">
          Patient name
          <TextInput
            className="input"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Age
          <TextInput
            className="input"
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Address
          <TextInput
            className="input"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
          />
        </label>
        <label className="field">
          Identification mark
          <TextInput
            className="input"
            value={identificationMark}
            onChange={(e) => setIdentificationMark(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Sign method
          <Select
            className="input"
            value={signMethod}
            onChange={(e) => setSignMethod(e.target.value as "signature" | "thumb")}
          >
            <option value="signature">Signature</option>
            <option value="thumb">Thumb impression</option>
          </Select>
        </label>
        <label className="field">
          Reason
          <Textarea
            className="input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </label>
        <div className="cert-dates">
          <label className="field">
            From
            <TextInput
              className="input"
              type="date"
              value={fromOn}
              onChange={(e) => setFromOn(e.target.value)}
              required
            />
          </label>
          <label className="field">
            To
            <TextInput
              className="input"
              type="date"
              value={toOn}
              onChange={(e) => setToOn(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="field">
          Diagnosis (optional, doctor only)
          <TextInput
            className="input"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy || regMissing}>
          {busy ? "Saving…" : "Finalise and print"}
        </button>
      </form>
    </main>
  );
}
