import {
  CONSENT_TEMPLATE_META,
  consentPrintDocumentId,
  DRAFT_CONSENT_TEMPLATES,
  displayAge,
  displayMobile,
  formatDisplayDate,
  istDate,
  parseConsentTemplateKey,
  resolveConsentTemplates,
  type ConsentTemplateKey,
  type ConsentTemplates,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { getPatient } from "../patients";
import { clinicHeaderFromSettings } from "./clinic-header";
import { ConsentSheet } from "./ConsentSheet";
import "./consent-print.css";
import "./print-screen.css";

/** 4.4.2 treatment consent form print (A4, one page for extraction). */
export function PrintConsentScreen() {
  const { patientId } = useParams<{ patientId: string }>();
  const [params, setParams] = useSearchParams();
  const templateKey = parseConsentTemplateKey(params.get("template")) ?? "extraction";

  const [patientName, setPatientName] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientMobile, setPatientMobile] = useState("");
  const [templates, setTemplates] = useState<ConsentTemplates>(DRAFT_CONSENT_TEMPLATES);
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [duplicate, setDuplicate] = useState(false);
  const [dupDate, setDupDate] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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
        setPatientCode(patient.code);
        setPatientMobile(patient.mobile ? displayMobile(patient.mobile) : "");
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
        setClinic(clinicHeaderFromSettings(settings.settings));
        const row = settings.settings.find((s) => s.key === "consent.templates");
        setTemplates(resolveConsentTemplates(row?.value));
        const docId = consentPrintDocumentId(patientId, templateKey);
        const preview = await api<{ isReprint: boolean }>(
          `/api/staff/print-log/preview?kind=consent&id=${encodeURIComponent(docId)}`,
        ).catch(() => ({ isReprint: false }));
        setDuplicate(preview.isReprint);
        if (preview.isReprint) setDupDate(istDate(new Date()));
        document.title = printTitle("Consent", patient.code, new Date().toISOString());
        setReady(true);
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, templateKey]);

  async function onPrint() {
    if (!patientId) return;
    try {
      const recorded = await api<{ isReprint: boolean }>("/api/staff/print-log", {
        method: "POST",
        body: JSON.stringify({
          documentKind: "consent",
          documentId: consentPrintDocumentId(patientId, templateKey),
          documentVersion: templates[templateKey].version,
        }),
      });
      setDuplicate(recorded.isReprint);
      if (recorded.isReprint) setDupDate(istDate(new Date()));
      window.print();
    } catch (err) {
      setProblem(problemText(err));
    }
  }

  function setTemplate(key: ConsentTemplateKey) {
    const next = new URLSearchParams(params);
    next.set("template", key);
    setParams(next, { replace: true });
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
  if (!ready) return <main className="print-screen muted">Loading…</main>;

  const tpl = templates[templateKey];
  const meta = CONSENT_TEMPLATE_META[templateKey];

  return (
    <main className="print-screen">
      <div className="card print-toolbar">
        <div>
          <h1>Consent form</h1>
          <p className="muted">
            {tpl.title}, version {tpl.version}. Text is the doctor&apos;s own; lawyer still to
            confirm.
          </p>
        </div>
        <label className="print-option">
          Template
          <select
            className="input"
            value={templateKey}
            onChange={(e) => setTemplate(e.target.value as ConsentTemplateKey)}
          >
            {(Object.keys(templates) as ConsentTemplateKey[]).map((k) => (
              <option key={k} value={k}>
                {templates[k].title}
              </option>
            ))}
          </select>
        </label>
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
        >
          <ConsentSheet
            tpl={tpl}
            lang={meta.lang}
            toothLine={meta.toothLine}
            data={{
              patientName,
              patientCode,
              age: patientAge,
              mobile: patientMobile,
              dateText: formatDisplayDate(istDate(new Date())),
              doctorName: clinic.doctorName,
            }}
          />
        </PrintLayout>
      </div>
    </main>
  );
}
