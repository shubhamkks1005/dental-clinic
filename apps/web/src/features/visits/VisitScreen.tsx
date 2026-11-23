import type { FdiTooth } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/client";
import { useMe } from "../auth";
import { PatientFilesTab } from "../files";
import { PatientHistoryTab } from "../history";
import { ProfileAlerts } from "../medical-history";
import { getPatient, type PatientDetail } from "../patients";
import { VisitPlanPanel } from "../plan";
import { StatusLabel } from "../../ui/StatusLabel";
import { Tabs } from "../../ui/Tabs";
import { getVisit, listRecentVisits, type VisitRecent, type VisitSummary } from "./api";
import { RecentVisitsSide } from "./RecentVisitsSide";
import { VisitChartTab } from "./VisitChartTab";
import { VisitFinaliseBar } from "./VisitFinaliseBar";
import { VisitNextSteps } from "./VisitNextSteps";
import { VisitPatientStrip } from "./VisitPatientStrip";
import { VISIT_TAB_IDS, VISIT_TAB_LABEL, type VisitTabId } from "./visit-tabs";
import { VisitMedicinesPanel } from "../prescriptions";
import { VisitTodayPanel } from "./VisitTodayPanel";
import "./visit.css";

/** 3.5.2 visit layout (S05): alerts, tabs, last visits side panel. */
export function VisitScreen() {
  const { id } = useParams<{ id: string }>();
  const { permissions } = useMe();
  const canViewClinical = permissions.includes("clinical.view");
  const canEditClinical = permissions.includes("clinical.edit");
  const canWriteRx = permissions.includes("prescriptions.write");
  const canSeeFlags = permissions.includes("clinical.alert_flag");
  const canBill = permissions.includes("bills.create");

  const [visit, setVisit] = useState<VisitSummary | null>(null);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [recent, setRecent] = useState<VisitRecent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<VisitTabId>("today");
  const [planTooth, setPlanTooth] = useState<FdiTooth | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    setVisit(null);
    setPatient(null);
    setRecent([]);
    getVisit(id)
      .then(async (row) => {
        if (cancelled) return;
        setVisit(row);
        const [p, list] = await Promise.all([
          getPatient(row.patientId),
          listRecentVisits(row.patientId, 3),
        ]);
        if (cancelled) return;
        setPatient(p);
        setRecent(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this visit. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <p className="notice notice-error" role="alert">
        Visit not found. Go back to Today.
      </p>
    );
  }
  if (error) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }
  if (!visit || !patient) return <p className="muted">Loading visit…</p>;

  const tabs = VISIT_TAB_IDS.map((tabId) => ({
    id: tabId,
    label: VISIT_TAB_LABEL[tabId],
    content:
      tabId === "today" ? (
        <VisitTodayPanel visit={visit} canEdit={canEditClinical} onVisitChange={setVisit} />
      ) : tabId === "chart" ? (
        canViewClinical ? (
          <VisitChartTab
            visit={visit}
            patient={patient}
            canEdit={canEditClinical}
            onVisitChange={setVisit}
            onToothFocus={setPlanTooth}
          />
        ) : (
          <p className="muted">Chart is only for the doctor.</p>
        )
      ) : tabId === "plan" ? (
        canViewClinical ? (
          <VisitPlanPanel
            patientId={patient.id}
            visitId={visit.id}
            canEdit={canEditClinical}
            toothFdi={planTooth}
          />
        ) : (
          <p className="muted">Plan is only for the doctor.</p>
        )
      ) : tabId === "medicines" ? (
        <VisitMedicinesPanel visitId={visit.id} patientId={patient.id} canWrite={canWriteRx} />
      ) : tabId === "history" ? (
        <PatientHistoryTab patientId={patient.id} />
      ) : (
        <PatientFilesTab patientId={patient.id} />
      ),
  }));

  return (
    <div className="visit-screen">
      <p className="visit-back">
        <Link to="/app">← Today</Link>
      </p>

      <ProfileAlerts
        patientId={patient.id}
        canViewClinical={canViewClinical}
        canSeeFlags={canSeeFlags}
      />

      <header className={`visit-head${visit.status === "void" ? " is-void" : ""}`}>
        <div className="visit-head-text">
          <h1>{patient.fullName}</h1>
          <VisitPatientStrip patient={patient} dateLocal={visit.visitDateLocal} />
          {visit.status === "void" ? <p className="muted small">Entered in error</p> : null}
        </div>
        <StatusLabel kind="visit" value={visit.status} />
      </header>

      <VisitFinaliseBar visit={visit} canEdit={canEditClinical} onFinalised={setVisit} />

      <VisitNextSteps visit={visit} canBill={canBill} />

      <div className="visit-body">
        <div className="visit-main">
          <Tabs
            label="Visit sections"
            tabs={tabs}
            value={tab}
            onChange={(next) => {
              if (VISIT_TAB_IDS.includes(next as VisitTabId)) setTab(next as VisitTabId);
            }}
          />
        </div>
        <RecentVisitsSide visits={recent} currentVisitId={visit.id} />
      </div>
    </div>
  );
}
