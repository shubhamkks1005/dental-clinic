import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ApiError } from "../../api/client";
import { useMe } from "../auth";
import { Tabs } from "../../ui/Tabs";
import { getPatient, type PatientDetail } from "./api";
import { VisitChartPanel } from "../chart";
import { PatientFilesTab } from "../files";
import { PatientHistoryTab, getHistorySummary } from "../history";
import { PatientVisitsTab } from "../visits/PatientVisitsTab";
import { PatientAppointmentsTab } from "./PatientAppointmentsTab";
import { PatientOverviewTab } from "./PatientOverviewTab";
import { PatientProfileHeader } from "./PatientProfileHeader";
import { readyPatientTabs } from "./patient-tabs";
import "./patient-profile.css";

// S04 (laptop) / S17 (phone): profile with ready tabs only (2.2.2 / edit 2.2.4).
export function PatientProfileScreen() {
  const { id } = useParams<{ id: string }>();
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
  const [defaultTabReady, setDefaultTabReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    setPatient(null);
    setDefaultTabReady(false);
    getPatient(id)
      .then(async (row) => {
        if (cancelled) return;
        setPatient(row);
        // 3.5.11: returning patient (any past visit) opens on History.
        try {
          const summary = await getHistorySummary(row.id);
          if (!cancelled && summary.totalVisits > 0) setTab("history");
        } catch {
          // Keep overview if summary fails; History tab still loads on click.
        } finally {
          if (!cancelled) setDefaultTabReady(true);
        }
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
  }, [id]);

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

  if (!patient || !defaultTabReady) {
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
        ) : (
          <PatientAppointmentsTab patientId={patient.id} />
        ),
    }));

  return (
    <div className="patient-profile">
      <PatientProfileHeader
        patient={patient}
        canViewClinical={canViewClinical}
        canSeeFlags={canSeeFlags}
        canEditClinical={canEditClinical}
      />
      <Tabs label="Patient sections" tabs={tabs} value={tab} onChange={setTab} />
    </div>
  );
}
