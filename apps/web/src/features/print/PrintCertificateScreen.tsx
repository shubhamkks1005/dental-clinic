import {
  CERTIFICATE_DRAFT_BANNER,
  formatDisplayDate,
  istDate,
  registrationMissing,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { getCertificate, type CertificateDto } from "../certificates";
import { clinicHeaderFromSettings } from "./clinic-header";
import "./certificate-print.css";
import "./print-screen.css";

/** 4.4.3 medical certificate print (A4). Duplicate copy on reprint. */
export function PrintCertificateScreen() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<CertificateDto | null>(null);
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [duplicate, setDuplicate] = useState(false);
  const [dupDate, setDupDate] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [certificate, settings] = await Promise.all([
          getCertificate(id),
          api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
        ]);
        if (cancelled) return;
        if (certificate.status === "draft") {
          setProblem("Finalise this certificate before printing.");
          return;
        }
        setCert(certificate);
        setClinic(clinicHeaderFromSettings(settings.settings));
        const preview = await api<{ isReprint: boolean }>(
          `/api/staff/print-log/preview?kind=certificate&id=${encodeURIComponent(id)}`,
        ).catch(() => ({ isReprint: false }));
        setDuplicate(preview.isReprint);
        if (preview.isReprint) setDupDate(istDate(new Date()));
        document.title = printTitle(
          "Certificate",
          certificate.certNo ?? certificate.id,
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
    if (!cert) return;
    try {
      const recorded = await api<{ isReprint: boolean }>("/api/staff/print-log", {
        method: "POST",
        body: JSON.stringify({
          documentKind: "certificate",
          documentId: cert.id,
          documentVersion: cert.version,
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
        <Link to="/app/certificates">Back</Link>
      </main>
    );
  }
  if (!cert) return <main className="print-screen muted">Loading…</main>;

  const issuedOn = cert.finalisedAt ? istDate(new Date(cert.finalisedAt)) : istDate(new Date());
  const regEmpty = registrationMissing(cert.doctorRegistrationNo);

  return (
    <main className="print-screen">
      <div className="card print-toolbar">
        <div>
          <h1>Medical certificate</h1>
          <p className="muted">
            {cert.certNo ?? "No number"} · {cert.status}
          </p>
        </div>
        <div className="print-actions">
          <button type="button" className="btn btn-primary" onClick={() => void onPrint()}>
            Print
          </button>
          <Link to="/app/certificates" className="btn">
            Register
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
        >
          <h2 className="cert-print-title">Medical certificate</h2>
          <p className="cert-print-banner">{CERTIFICATE_DRAFT_BANNER}</p>
          <p className="cert-print-meta">
            No. <strong>{cert.certNo}</strong> · Date {formatDisplayDate(issuedOn)}
          </p>
          <p>
            This is to certify that <strong>{cert.patientName}</strong>
            {cert.patientAge ? ` (age ${cert.patientAge})` : ""}
            {cert.patientAddress ? `, residing at ${cert.patientAddress}` : ""}, was under my care
            from <strong>{formatDisplayDate(cert.fromOn)}</strong> to{" "}
            <strong>{formatDisplayDate(cert.toOn)}</strong>.
          </p>
          <p>
            <strong>Reason:</strong> {cert.reason}
          </p>
          {cert.diagnosis ? (
            <p>
              <strong>Diagnosis:</strong> {cert.diagnosis}
            </p>
          ) : null}
          <p>
            <strong>Identification mark:</strong> {cert.identificationMark}
          </p>
          <p>
            <strong>
              Patient {cert.signMethod === "thumb" ? "thumb impression" : "signature"}:
            </strong>{" "}
            ________________________
          </p>
          <div className="cert-print-doctor">
            <p>
              Doctor: {clinic.doctorName}
              {regEmpty
                ? " · Reg. no. (missing — set in Settings)"
                : ` · Reg. no. ${cert.doctorRegistrationNo}`}
            </p>
            <p>Doctor signature: ________________________</p>
          </div>
        </PrintLayout>
      </div>
    </main>
  );
}
