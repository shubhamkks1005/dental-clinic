import { Navigate, Route, Routes } from "react-router";
import { useMe, UserCard } from "../features/auth";
import { MoreScreen } from "../features/more";
import {
  NewPatientScreen,
  PatientConsentsScreen,
  PatientProfileScreen,
  PatientSearch,
  PatientsScreen,
} from "../features/patients";
import { PrintRoutes } from "../features/print";
import { SettingsScreen } from "../features/settings";
import { StyleGuideScreen } from "../features/style-guide";
import { AppointmentsScreen } from "../features/appointments";
import { CertificateRegisterScreen, NewCertificateScreen } from "../features/certificates";
import { TodayScreen } from "../features/today";
import { VisitScreen } from "../features/visits";
import { BillingHomeScreen, BillScreen } from "../features/billing";
import { NotBuiltYet, NotFound } from "../ui/PageMessage";
import { MAIN_NAV, NEW_PATIENT_PERMISSION, PHONE_TABS, visibleNav } from "../ui/shell/nav-items";
import { StaffShell } from "../ui/shell/StaffShell";

// Screens behind the nav items that later tasks will build.
const NOT_BUILT = ["messages", "reports"];

// Print screens open without the app frame; every other staff screen sits inside it.
export function StaffRoutes() {
  return (
    <Routes>
      <Route path="print/*" element={<PrintRoutes />} />
      <Route path="*" element={<ShellRoutes />} />
    </Routes>
  );
}

function ShellRoutes() {
  const { permissions } = useMe();
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
      user={<UserCard />}
      search={permissions.includes("patients.view") ? <PatientSearch /> : <span />}
    >
      <Routes>
        <Route index element={home} />
        <Route path="appointments" element={<AppointmentsScreen />} />
        <Route path="patients" element={<PatientsScreen />} />
        <Route path="patients/new" element={<NewPatientScreen />} />
        <Route path="patients/:id/consents" element={<PatientConsentsScreen />} />
        <Route path="patients/:id/certificates/new" element={<NewCertificateScreen />} />
        <Route path="patients/:id" element={<PatientProfileScreen />} />
        <Route path="certificates" element={<CertificateRegisterScreen />} />
        <Route path="visits/:id" element={<VisitScreen />} />
        <Route path="billing" element={<BillingHomeScreen />} />
        <Route path="bills/:id" element={<BillScreen />} />
        <Route path="settings/*" element={<SettingsScreen />} />
        <Route path="more" element={<MoreScreen />} />
        <Route path="style-guide" element={<StyleGuideScreen />} />
        {NOT_BUILT.map((path) => (
          <Route key={path} path={path} element={<NotBuiltYet />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </StaffShell>
  );
}
