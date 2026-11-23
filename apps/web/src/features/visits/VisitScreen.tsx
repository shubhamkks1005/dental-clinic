import type { FdiTooth } from "@clinic/shared";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMe } from "../auth";
import { PatientFilesTab } from "../files";
import { PatientHistoryTab } from "../history";
import { VisitPlanPanel } from "../plan";
import { Tabs } from "../../ui/Tabs";
import { useVisitData } from "./useVisitData";
import { VisitHeaderStrip } from "./VisitHeaderStrip";
import { VisitOneScreen } from "./VisitOneScreen";
import { VISIT_TAB_IDS, VISIT_TAB_LABEL, type VisitTabId } from "./visit-tabs";
import "./visit.css";

/** Q2.4: the visit on one screen (Visit.dc.html / PhoneVisit.dc.html), with Plan, History, Files. */
export function VisitScreen() {
  const { id } = useParams<{ id: string }>();
  const { permissions } = useMe();
  const canViewClinical = permissions.includes("clinical.view");
  const canEdit = permissions.includes("clinical.edit");
  const { visit, patient, recent, error, setVisit } = useVisitData(id);
  const [tab, setTab] = useState<VisitTabId>("visit");
  const [planTooth, setPlanTooth] = useState<FdiTooth | null>(null);

  if (!id || error) {
    return (
      <p className="notice notice-error" role="alert">
        {error ?? "Visit not found. Go back to Today."}
      </p>
    );
  }
  if (!visit || !patient) return <p className="muted">Loading visit…</p>;

  const content: Record<VisitTabId, React.ReactNode> = {
    visit: (
      <VisitOneScreen
        visit={visit}
        patient={patient}
        recent={recent}
        canEdit={canEdit}
        canViewClinical={canViewClinical}
        canWriteRx={permissions.includes("prescriptions.write")}
        canBill={permissions.includes("bills.create")}
        onVisitChange={setVisit}
        onToothFocus={setPlanTooth}
      />
    ),
    plan: canViewClinical ? (
      <VisitPlanPanel
        patientId={patient.id}
        visitId={visit.id}
        canEdit={canEdit}
        toothFdi={planTooth}
      />
    ) : (
      <p className="muted">Plan is only for the doctor.</p>
    ),
    history: <PatientHistoryTab patientId={patient.id} />,
    files: <PatientFilesTab patientId={patient.id} />,
  };

  return (
    <div className="visit-screen">
      <p className="visit-back">
        <Link to="/app">← Today</Link>
      </p>
      <VisitHeaderStrip
        visit={visit}
        patient={patient}
        canViewClinical={canViewClinical}
        canSeeFlags={permissions.includes("clinical.alert_flag")}
        onPastVisits={() => setTab("history")}
      />
      <Tabs
        label="Visit sections"
        tabs={VISIT_TAB_IDS.map((tabId) => ({
          id: tabId,
          label: VISIT_TAB_LABEL[tabId],
          content: content[tabId],
        }))}
        value={tab}
        onChange={(next) => {
          if (VISIT_TAB_IDS.includes(next as VisitTabId)) setTab(next as VisitTabId);
        }}
      />
    </div>
  );
}
