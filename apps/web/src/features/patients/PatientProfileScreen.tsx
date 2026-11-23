import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { ApiError } from "../../api/client";
import { useMe } from "../auth";
import { Tabs } from "../../ui/Tabs";
import { getPatient, type PatientDetail } from "./api";
import { VisitChartPanel } from "../chart";
import { PatientBillingPanel } from "../billing";
import { PatientFilesTab } from "../files";
import { PatientMessagesTab } from "../messages";
import { PatientHistoryTab } from "../history";
import { PatientVisitsTab } from "../visits/PatientVisitsTab";
import { PatientAppointmentsTab } from "./PatientAppointmentsTab";
import { PatientOverviewTab } from "./PatientOverviewTab";
import { PatientProfileHeader } from "./PatientProfileHeader";
import { parsePatientTab, readyPatientTabs } from "./patient-tabs";
import "./patient-profile.css";

// S04 (laptop) / S17 (phone): profile with ready tabs only (2.2.2 / edit 2.2.4).
export function PatientProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const [query] = useSearchParams();
  const wantedTab = parsePatientTab(query.get("tab"));
  const { permissions } = useMe();
  const canEdit = permissions.includes("patients.edit");
  const canViewClinical = permissions.includes("clinical.view");
  const canEditClinical = permissions.includes("clinical.edit");
  const canSeeFlags = permissions.includes("clinical.alert_flag");
  const canSeeFiles =
    permissions.includes("files.clinical") || permissions.includes("files.documents");
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    setPatient(null);
    getPatient(id)
      .then((row) => {
        if (cancelled) return;
        setPatient(row);
        // Q2.6: a patient always opens on Overview, unless a link asks for a tab (?tab=).
        setTab(wantedTab ?? "overview");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this patient. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, wantedTab]);

  if (!id) {
    return (
      <p className="notice notice-error" role="alert">
        Patient not found. Go back to the patients list.
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

  if (!patient) {
    return <p className="muted">Loading…</p>;
  }

  const tabs = readyPatientTabs()
    .filter(
      (t) =>
        ((t.id !== "chart" && t.id !== "visits") || canViewClinical) &&
        (t.id !== "files" || canSeeFiles),
    )
    .map((t) => ({
      id: t.id,
      label: t.label,
      content:
        t.id === "overview" ? (
          <PatientOverviewTab
            patient={patient}
            canEdit={canEdit}
            canViewClinical={canViewClinical}
            canEditClinical={canEditClinical}
            onPatientChange={setPatient}
            onTakePayment={() => setTab("billing")}
          />
        ) : t.id === "history" ? (
          <PatientHistoryTab patientId={patient.id} />
        ) : t.id === "chart" ? (
          <VisitChartPanel
            patientId={patient.id}
            canEdit={canEditClinical}
            dateOfBirth={patient.dateOfBirth}
            ageYearsAtReg={patient.ageYearsAtReg}
            registeredOn={patient.createdAt.slice(0, 10)}
          />
        ) : t.id === "visits" ? (
          <PatientVisitsTab patientId={patient.id} />
        ) : t.id === "files" ? (
          <PatientFilesTab patientId={patient.id} />
        ) : t.id === "billing" ? (
          <PatientBillingPanel patientId={patient.id} />
        ) : t.id === "messages" ? (
          <PatientMessagesTab patientId={patient.id} />
        ) : (
          <PatientAppointmentsTab patientId={patient.id} patientName={patient.fullName} />
        ),
    }));

  return (
    <div className="patient-profile">
      <PatientProfileHeader
        patient={patient}
        canViewClinical={canViewClinical}
        canSeeFlags={canSeeFlags}
        canEditClinical={canEditClinical}
        onTakePayment={() => setTab("billing")}
      />
      <Tabs label="Patient sections" tabs={tabs} value={tab} onChange={setTab} />
    </div>
  );
}
