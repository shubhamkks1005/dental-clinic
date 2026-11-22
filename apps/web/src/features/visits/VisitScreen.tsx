import { VISIT_STATUS_LABEL } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/client";
import { useMe } from "../auth";
import { VisitChartPanel } from "../chart";
import { ProfileAlerts } from "../medical-history";
import { getPatient, type PatientDetail } from "../patients";
import { StatusBadge } from "../../ui/StatusBadge";
import { Tabs } from "../../ui/Tabs";
import { getVisit, listRecentVisits, type VisitRecent, type VisitSummary } from "./api";
import { RecentVisitsSide } from "./RecentVisitsSide";
import { VisitStubPanel } from "./VisitStubPanel";
import { VISIT_TAB_IDS, VISIT_TAB_LABEL, type VisitTabId } from "./visit-tabs";
import { VisitTodayPanel } from "./VisitTodayPanel";
import "./visit.css";

/** 3.5.2 visit layout (S05): alerts, tabs, last visits side panel. */
export function VisitScreen() {
  const { id } = useParams<{ id: string }>();
  const { permissions } = useMe();
  const canViewClinical = permissions.includes("clinical.view");
  const canEditClinical = permissions.includes("clinical.edit");
  const canSeeFlags = permissions.includes("clinical.alert_flag");

  const [visit, setVisit] = useState<VisitSummary | null>(null);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [recent, setRecent] = useState<VisitRecent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<VisitTabId>("today");

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
          <VisitChartPanel
            patientId={patient.id}
            canEdit={canEditClinical && visit.status === "draft"}
            dateOfBirth={patient.dateOfBirth}
            ageYearsAtReg={patient.ageYearsAtReg}
            registeredOn={patient.createdAt.slice(0, 10)}
          />
        ) : (
          <p className="muted">Chart is only for the doctor.</p>
        )
      ) : tabId === "plan" ? (
        <VisitStubPanel
          title="Plan"
          note="Treatment plan for this visit will open here (Phase 3.6)."
        />
      ) : tabId === "history" ? (
        <VisitStubPanel
          title="History"
          note="Full patient history opens on the patient profile History tab (3.5.11)."
        />
      ) : (
        <VisitStubPanel title="Files" note="X-rays and photos will open here (Phase 3.7)." />
      ),
  }));

  return (
    <div className="visit-screen">
      <p className="visit-back">
        <Link to="/app">← Today</Link>
        {" · "}
        <Link to={`/app/patients/${visit.patientId}`}>Patient</Link>
      </p>

      <ProfileAlerts
        patientId={patient.id}
        canViewClinical={canViewClinical}
        canSeeFlags={canSeeFlags}
      />

      <header className="visit-head">
        <div className="visit-head-text">
          <h1>{patient.fullName}</h1>
          <p className="muted small">
            Visit · {visit.visitDateLocal} · {patient.code}
          </p>
        </div>
        <StatusBadge
          tone={visit.status === "draft" ? "upcoming" : "done"}
          label={VISIT_STATUS_LABEL[visit.status]}
        />
      </header>

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
