import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { useMe, UserCard } from "../features/auth";
import { MoreScreen } from "../features/more";
import {
  NewPatientScreen,
  PatientConsentsScreen,
  PatientProfileScreen,
  PatientSearch,
  PatientsScreen,
} from "../features/patients";
import { AppointmentsScreen } from "../features/appointments";
import { TodayScreen } from "../features/today";
import { VisitScreen } from "../features/visits";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { NotFound } from "../ui/PageMessage";
import { RequirePermission } from "../ui/RequirePermission";
import { RouteFallback } from "../ui/RouteFallback";
import { MAIN_NAV, NEW_PATIENT_PERMISSION, PHONE_TABS, visibleNav } from "../ui/shell/nav-items";
import { StaffShell } from "../ui/shell/StaffShell";

// S3.1.1: rarely used screens load as their own chunk. Today, Appointments, Patients, the patient
// profile and Visit stay in the main bundle. If a chunk fails to download (for example a new
// deploy renamed the file), React throws while rendering and the ErrorBoundary shows Reload.
const PrintRoutes = lazy(() =>
  import("../features/print").then((m) => ({ default: m.PrintRoutes })),
);
const SettingsScreen = lazy(() =>
  import("../features/settings/SettingsScreen").then((m) => ({ default: m.SettingsScreen })),
);
// The new doctor visit page (design doctor_visit.html) is built step by step on its own route until it replaces the old visit screen.
const DoctorVisitPage = lazy(() =>
  import("../features/visit-doctor").then((m) => ({ default: m.DoctorVisitPage })),
);
const LibraryScreen = lazy(() =>
  import("../features/library/LibraryScreen").then((m) => ({ default: m.LibraryScreen })),
);
const ReportsScreen = lazy(() =>
  import("../features/reports/ReportsScreen").then((m) => ({ default: m.ReportsScreen })),
);
const BillingHomeScreen = lazy(() =>
  import("../features/billing/BillingHomeScreen").then((m) => ({ default: m.BillingHomeScreen })),
);
const BillScreen = lazy(() =>
  import("../features/billing/BillScreen").then((m) => ({ default: m.BillScreen })),
);
const CertificateRegisterScreen = lazy(() =>
  import("../features/certificates/CertificateRegisterScreen").then((m) => ({
    default: m.CertificateRegisterScreen,
  })),
);
const NewCertificateScreen = lazy(() =>
  import("../features/certificates/NewCertificateScreen").then((m) => ({
    default: m.NewCertificateScreen,
  })),
);
const MessagesScreen = lazy(() =>
  import("../features/messages/MessagesScreen").then((m) => ({ default: m.MessagesScreen })),
);
const RequestsScreen = lazy(() =>
  import("../features/requests/RequestsScreen").then((m) => ({ default: m.RequestsScreen })),
);
const ErrorLogScreen = lazy(() =>
  import("../features/errors/ErrorLogScreen").then((m) => ({ default: m.ErrorLogScreen })),
);
// Dev only. import.meta.env.DEV is a build-time constant, so production has no style-guide chunk.
const StyleGuideScreen = import.meta.env.DEV
  ? lazy(() =>
      import("../features/style-guide/StyleGuideScreen").then((m) => ({
        default: m.StyleGuideScreen,
      })),
    )
  : null;

// Print screens open without the app frame; every other staff screen sits inside it.
export function StaffRoutes() {
  return (
    <Routes>
      <Route
        path="print/*"
        element={
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <PrintRoutes />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route path="*" element={<ShellRoutes />} />
    </Routes>
  );
}

function ShellRoutes() {
  const { permissions, role } = useMe();
  const { pathname } = useLocation();
  // Developer (support) has no patient screens: start in Settings instead of Today.
  const home = permissions.includes("appointments.manage") ? (
    <TodayScreen />
  ) : (
    <Navigate to="/app/settings" replace />
  );

  return (
    <StaffShell
      mainNav={visibleNav(MAIN_NAV, permissions)}
      phoneTabs={visibleNav(PHONE_TABS, permissions)}
      canAddPatient={permissions.includes(NEW_PATIENT_PERMISSION)}
      topBarAddPatient={role !== "doctor"}
      user={<UserCard />}
      search={permissions.includes("patients.view") ? <PatientSearch /> : <span />}
    >
      {/* Inside the shell, so a failed chunk keeps the menu; key resets the error on navigation. */}
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route index element={home} />
            <Route path="appointments" element={<AppointmentsScreen />} />
            <Route path="patients" element={<PatientsScreen />} />
            <Route path="patients/new" element={<NewPatientScreen />} />
            <Route path="patients/:id/consents" element={<PatientConsentsScreen />} />
            <Route
              path="patients/:id/certificates/new"
              element={
                <RequirePermission permission="certificates.write">
                  <NewCertificateScreen />
                </RequirePermission>
              }
            />
            <Route path="patients/:id" element={<PatientProfileScreen />} />
            <Route path="certificates" element={<CertificateRegisterScreen />} />
            <Route
              path="visits/:id"
              element={
                <RequirePermission permission="clinical.view">
                  <VisitScreen />
                </RequirePermission>
              }
            />
            <Route
              path="visits/:id/new"
              element={
                <RequirePermission permission="clinical.view">
                  <DoctorVisitPage />
                </RequirePermission>
              }
            />
            <Route path="billing" element={<BillingHomeScreen />} />
            <Route path="bills/:id" element={<BillScreen />} />
            <Route path="reports" element={<ReportsScreen />} />
            <Route path="messages" element={<MessagesScreen />} />
            <Route
              path="library/*"
              element={
                <RequirePermission permission="settings.medicines">
                  <LibraryScreen />
                </RequirePermission>
              }
            />
            <Route path="settings/*" element={<SettingsScreen />} />
            <Route path="more" element={<MoreScreen />} />
            <Route
              path="errors"
              element={
                <RequirePermission permission="errors.view">
                  <ErrorLogScreen />
                </RequirePermission>
              }
            />
            <Route
              path="requests"
              element={
                <RequirePermission permission="requests.view">
                  <RequestsScreen />
                </RequirePermission>
              }
            />
            {StyleGuideScreen ? (
              <Route
                path="style-guide"
                element={
                  <RequirePermission permission="settings.write">
                    <StyleGuideScreen />
                  </RequirePermission>
                }
              />
            ) : null}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </StaffShell>
  );
}
