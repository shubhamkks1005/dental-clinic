import { statusWord } from "@clinic/shared";
import { formatDate } from "../../ui/format";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { listCertificateRegister, type CertificateDto } from "./api";
import "./certificates.css";

/** 4.4.3 certificate register: every finalised cert + print/reprint. */
export function CertificateRegisterScreen() {
  const me = useMe();
  const canWrite = me.permissions.includes("certificates.write");
  const [rows, setRows] = useState<CertificateDto[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    listCertificateRegister()
      .then(setRows)
      .catch((err) => setProblem(problemText(err)));
  }, []);

  return (
    <main className="certificates-register">
      <header className="page-header">
        <div>
          <h1>Certificate register</h1>
          <p className="muted">Finalised medical certificates. Reprint keeps the original date.</p>
        </div>
      </header>
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      {rows === null && !problem ? <p className="muted">Loading…</p> : null}
      {rows && rows.length === 0 ? <p className="muted">No certificates yet.</p> : null}
      {rows && rows.length > 0 ? (
        <ul className="cert-register-list">
          {rows.map((c) => (
            <li key={c.id} className="cert-register-item">
              <div>
                <strong>{c.certNo ?? "—"}</strong>
                <span className="muted">
                  {" "}
                  · {c.patientName} · {statusWord("visit", c.status).label}
                  {c.finalisedAt ? ` · ${formatDate(new Date(c.finalisedAt))}` : ""}
                </span>
                {canWrite && c.diagnosis ? (
                  <p className="muted small">Diagnosis: {c.diagnosis}</p>
                ) : null}
              </div>
              <Link className="btn" to={`/app/print/certificate/${encodeURIComponent(c.id)}`}>
                Print
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
