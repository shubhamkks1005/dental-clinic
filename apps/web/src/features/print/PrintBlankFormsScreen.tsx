import {
  BLANK_FORM_COPY_COUNT,
  BLANK_FORM_KINDS,
  BLANK_FORM_LABELS,
  istDate,
  parseBlankFormKind,
  type BlankFormKind,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { BlankFormPages } from "./BlankFormPages";
import { clinicHeaderFromSettings } from "./clinic-header";
import "./blank-forms-print.css";
import "./print-screen.css";

/** 4.4.6 blank forms: print 20 copies in one click for downtime. */
export function PrintBlankFormsScreen() {
  const [params, setParams] = useSearchParams();
  const kind: BlankFormKind = parseBlankFormKind(params.get("kind")) ?? "registration";
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    document.title = printTitle("Blank forms", BLANK_FORM_LABELS[kind], new Date().toISOString());
    api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings")
      .then((s) => setClinic(clinicHeaderFromSettings(s.settings)))
      .catch((err) => setProblem(problemText(err)));
  }, [kind]);

  async function onPrint() {
    try {
      await api("/api/staff/print-log", {
        method: "POST",
        body: JSON.stringify({
          documentKind: "blank_form",
          documentId: `${kind}:${istDate(new Date())}`,
          copies: BLANK_FORM_COPY_COUNT,
        }),
      });
      window.print();
    } catch (err) {
      setProblem(problemText(err));
    }
  }

  function setKind(next: BlankFormKind) {
    const p = new URLSearchParams(params);
    p.set("kind", next);
    setParams(p, { replace: true });
  }

  const copies = Array.from({ length: BLANK_FORM_COPY_COUNT }, (_, i) => i);

  return (
    <main className="print-screen">
      <div className="card print-toolbar">
        <div>
          <h1>Blank forms</h1>
          <p className="muted">
            Prints {BLANK_FORM_COPY_COUNT} copies of {BLANK_FORM_LABELS[kind]} for paper downtime.
          </p>
        </div>
        <label className="print-option">
          Form
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value as BlankFormKind)}
          >
            {BLANK_FORM_KINDS.map((k) => (
              <option key={k} value={k}>
                {BLANK_FORM_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <div className="print-actions">
          <button type="button" className="btn btn-primary" onClick={() => void onPrint()}>
            Print {BLANK_FORM_COPY_COUNT} copies
          </button>
          <Link to="/app" className="btn">
            Back
          </Link>
        </div>
      </div>
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      <div className="print-scroll blank-forms-stack">
        {copies.map((i) => (
          <PrintLayout key={i} size="A4" header="print" clinic={clinic}>
            <BlankFormPages kind={kind} />
            <p className="blank-copy-mark">
              Copy {i + 1} of {BLANK_FORM_COPY_COUNT}
            </p>
          </PrintLayout>
        ))}
      </div>
    </main>
  );
}
