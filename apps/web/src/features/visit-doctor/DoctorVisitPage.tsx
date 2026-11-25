import { chartConditionsFromList, type FdiTooth, type ListItem } from "@clinic/shared";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { ApiError } from "../../api/client";
import { createRequestScope } from "../../ui/request-scope";
import { RequestScopeProvider, useRequestScope } from "../../ui/RequestScope";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { useMe } from "../auth";
import { VisitChartPanel } from "../chart";
import { getPatient, type PatientDetail } from "../patients";
import { VisitMedicinesPanel, type RxStatus } from "../prescriptions";
import { NextVisitChips } from "../visits/NextVisitChips";
import { useVisitNotes } from "../visits/useVisitNotes";
import { listOnce } from "../visits/visit-prefetch";
import { VisitConflictBanner } from "../visits/VisitConflictBanner";
import { VisitMoreNotes } from "../visits/VisitMoreNotes";
import { VisitNoteField } from "../visits/VisitNoteField";
import { DiagProcPanel } from "./DiagProcPanel";
import { ToothCard } from "./ToothCard";
import { DocBar } from "./DocBar";
import { summaryText, searchOptions } from "./lines-model";
import { getLineUsage, getVisitPage, type LineUsage, type VisitPageData } from "./page-api";
import { SidePane, type SideTab } from "./SidePane";
import { useVisitLines } from "./useVisitLines";
import { VisitDocHeader } from "./VisitDocHeader";
import "../visits/visit.css";
import "./visit-doc-tokens.css";
import "./visit-doc.css";
import "./visit-doc-lines.css";
import "./visit-doc-tooth.css";

type AccId = "chart" | "diag" | "rx" | "more";
const OPEN_KEY = (visitId: string) => `vd-open-${visitId}`;

function readOpen(visitId: string): AccId {
  try {
    const v = window.localStorage.getItem(OPEN_KEY(visitId));
    if (v === "chart" || v === "diag" || v === "rx" || v === "more") return v;
  } catch {
    /* storage can be blocked: the first card opens */
  }
  return "chart";
}
function rememberOpen(visitId: string, id: AccId | null) {
  try {
    if (id) window.localStorage.setItem(OPEN_KEY(visitId), id);
  } catch {
    /* a convenience only */
  }
}

type Data = {
  page: VisitPageData;
  patient: PatientDetail;
  diagnosisList: ListItem[];
  procedureList: ListItem[];
  phrases: ListItem[];
  conditions: ListItem[];
  usage: LineUsage;
};

/** The doctor's visit page (design: docs/design/final/doctor_visit.html). Doctor only. */
export function DoctorVisitPage() {
  const { id } = useParams<{ id: string }>();
  // A new scope per visit: what it shares ends when this visit is closed (Part S).
  const scope = useMemo(() => createRequestScope(), [id]);
  return (
    <RequestScopeProvider scope={scope}>
      <VisitDocLoader id={id} />
    </RequestScopeProvider>
  );
}

function VisitDocLoader({ id }: { id: string | undefined }) {
  const scope = useRequestScope();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    Promise.all([
      getVisitPage(id),
      listOnce(scope, "diagnoses"),
      listOnce(scope, "procedures"),
      listOnce(scope, "quick_phrases").catch(() => [] as ListItem[]),
      listOnce(scope, "conditions").catch(() => [] as ListItem[]),
      getLineUsage().catch((): LineUsage => ({ diagnoses: {}, procedures: {} })),
    ])
      .then(async ([page, diagnosisList, procedureList, phrases, conditions, usage]) => {
        const patient = await getPatient(page.visit.patientId);
        if (!cancelled)
          setData({ page, patient, diagnosisList, procedureList, phrases, conditions, usage });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load this visit. Check the connection, then try again.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id, scope, round]);

  if (!id || error) {
    return (
      <p className="notice notice-error" role="alert">
        {error ?? "Visit not found. Go back to Today."}
      </p>
    );
  }
  if (!data) {
    return (
      <div className="visit-doc" aria-busy="true" aria-label="Loading the visit">
        <div className="vd-head">
          <div className="vd-skel" style={{ width: 280 }} />
          <div className="vd-skel" style={{ width: 460 }} />
        </div>
        <div className="vd-main">
          <div className="vd-left">
            {[1, 2, 3, 4].map((n) => (
              <div className="vd-acc vd-skel-card" key={n} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <VisitDocBody
      key={`${data.page.visit.id}-${data.page.visit.status}`}
      data={data}
      onReload={() => setRound((n) => n + 1)}
    />
  );
}

function VisitDocBody({ data, onReload }: { data: Data; onReload: () => void }) {
  const { permissions } = useMe();
  const { page, patient } = data;
  const visit = page.visit;
  const canEdit = permissions.includes("clinical.edit");
  const canWriteRx = permissions.includes("prescriptions.write");
  const finalised = visit.status !== "draft";
  const readOnly = !canEdit || finalised;
  const [tooth, setTooth] = useState<FdiTooth | null>(null);
  const [rxStatus, setRxStatus] = useState<RxStatus>("none");
  const [tab, setTab] = useState<SideTab>("history");
  const first = useMemo(() => readOpen(visit.id), [visit.id]);
  const conditionLabels = useMemo(
    () => new Map(chartConditionsFromList(data.conditions).map((c) => [c.code, c.label])),
    [data.conditions],
  );

  const notes = useVisitNotes({
    visit,
    phrases: data.phrases,
    readOnly,
    onSaved: () => undefined,
  });
  const lines = useVisitLines({
    visit,
    readOnly,
    toothHint: tooth,
    visitVersion: { get: () => notes.versionRef.current, set: notes.setVersion },
  });
  const conditionLabel = (code: string) => conditionLabels.get(code) ?? code;
  // A line saved on this visit changes what the tooth card shows: it reads the tooth again.
  const refreshKey = lines.savedAt ? lines.savedAt.getTime() : 0;
  const diagnosisOptions = useMemo(
    () => searchOptions(data.diagnosisList, data.usage.diagnoses),
    [data.diagnosisList, data.usage.diagnoses],
  );
  const procedureOptions = useMemo(
    () => searchOptions(data.procedureList, data.usage.procedures),
    [data.procedureList, data.usage.procedures],
  );

  function toggled(id: AccId) {
    return (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      if (e.currentTarget.open) rememberOpen(visit.id, id);
    };
  }
  function openRx() {
    const el = document.getElementById("vd-acc-rx");
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ block: "nearest" });
    }
  }

  const rxWord: Record<RxStatus, string> = {
    none: "No prescription",
    draft: "Draft",
    issued: "Issued",
    revised: "Revised",
  } as Record<RxStatus, string>;

  return (
    <div className="visit-doc">
      {!readOnly && <UnsavedChangesGuard dirty={notes.dirty} />}
      <VisitDocHeader
        patient={patient}
        page={page}
        canViewClinical
        canSeeFlags={permissions.includes("clinical.alert_flag")}
        onDues={() => setTab("history")}
      />
      <main className="vd-main">
        <div className="vd-left">
          {notes.status === "conflict" ? <VisitConflictBanner form={notes.form} /> : null}

          <details
            className="vd-acc"
            id="vd-acc-chart"
            name="vd-acc"
            open={first === "chart"}
            onToggle={toggled("chart")}
          >
            <summary>
              <span className="vd-acc-title">
                <span className="vd-acc-num">1</span>
                <span>Tooth chart</span>
              </span>
              <span className="vd-acc-summary">{tooth ? `Tooth ${tooth} chosen` : ""}</span>
            </summary>
            <div className="vd-acc-body">
              <VisitChartPanel
                patientId={patient.id}
                visitId={visit.id}
                canEdit={!readOnly}
                dateOfBirth={patient.dateOfBirth}
                ageYearsAtReg={patient.ageYearsAtReg}
                registeredOn={patient.createdAt.slice(0, 10)}
                onFocusChange={(t) => setTooth(t)}
              />
              {tooth !== null && (
                <ToothCard
                  patientId={patient.id}
                  visitId={visit.id}
                  tooth={tooth}
                  readOnly={readOnly}
                  conditionLabel={conditionLabel}
                  refreshKey={refreshKey}
                  onClose={() => setTooth(null)}
                  onSelectTooth={(t) => setTooth(t as FdiTooth)}
                />
              )}
            </div>
          </details>

          <details
            className="vd-acc"
            id="vd-acc-diag"
            name="vd-acc"
            open={first === "diag"}
            onToggle={toggled("diag")}
          >
            <summary>
              <span className="vd-acc-title">
                <span className="vd-acc-num">2</span>
                <span>Diagnosis &amp; Procedures</span>
              </span>
              <span className="vd-acc-summary" data-testid="acc-diag-summary">
                {summaryText(lines.diagnoses.length, lines.procedures.length)}
              </span>
            </summary>
            <div className="vd-acc-body">
              <DiagProcPanel
                lines={lines}
                diagnosisOptions={diagnosisOptions}
                procedureOptions={procedureOptions}
                plan={page.openPlanItems}
                readOnly={readOnly}
                finalised={finalised}
              />
            </div>
          </details>

          <details
            className="vd-acc"
            id="vd-acc-rx"
            name="vd-acc"
            open={first === "rx"}
            onToggle={toggled("rx")}
          >
            <summary>
              <span className="vd-acc-title">
                <span className="vd-acc-num">3</span>
                <span>Prescription &amp; Advice</span>
              </span>
              <span className="vd-acc-summary">{rxWord[rxStatus]}</span>
            </summary>
            <div className="vd-acc-body">
              <VisitMedicinesPanel
                visitId={visit.id}
                patientId={patient.id}
                canWrite={canWriteRx}
                compact
                onStatusChange={setRxStatus}
              />
            </div>
          </details>

          <details
            className="vd-acc"
            id="vd-acc-more"
            name="vd-acc"
            open={first === "more"}
            onToggle={toggled("more")}
          >
            <summary>
              <span className="vd-acc-title">
                <span className="vd-acc-num">4</span>
                <span>Files, Vitals &amp; Next Visit</span>
              </span>
              <span className="vd-acc-summary">
                {page.files.length} {page.files.length === 1 ? "file" : "files"}
                {notes.form.nextVisitNote ? ` · Next: ${notes.form.nextVisitNote}` : ""}
              </span>
            </summary>
            <div className="vd-acc-body">
              <NextVisitChips
                value={notes.form.nextVisitNote}
                readOnly={readOnly}
                onChange={(v) => notes.setField("nextVisitNote", v)}
              />
              <VisitMoreNotes
                form={notes.form}
                readOnly={readOnly}
                setField={notes.setField}
                setPhrase={notes.setPhrase}
              />
            </div>
          </details>

          <section className="vd-acc vd-notes" aria-label="Complaint and findings">
            <VisitNoteField
              label="Chief complaint"
              rows={2}
              value={notes.form.chiefComplaint}
              readOnly={readOnly}
              onChange={(v) => notes.setPhrase("chiefComplaint", v)}
            />
            <VisitNoteField
              label="Clinical findings"
              rows={2}
              value={notes.form.examNote}
              readOnly={readOnly}
              onChange={(v) => notes.setPhrase("examNote", v)}
            />
          </section>
        </div>
        <SidePane tab={tab} onTab={setTab} page={page} patientId={patient.id} />
      </main>
      <DocBar
        visit={visit}
        lines={lines}
        notesStatus={notes.status}
        rxStatus={rxStatus}
        version={() => notes.versionRef.current}
        onOpenRx={openRx}
        onFinalised={onReload}
      />
    </div>
  );
}
