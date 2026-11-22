import { Navigate, Route, Routes } from "react-router";
import { useMe, UserCard } from "../features/auth";
import { MoreScreen } from "../features/more";
import { NewPatientScreen, PatientConsentsScreen, PatientsScreen } from "../features/patients";
import { PrintRoutes } from "../features/print";
import { SettingsScreen } from "../features/settings";
import { StyleGuideScreen } from "../features/style-guide";
import { TodayScreen } from "../features/today";
import { NotBuiltYet, NotFound } from "../ui/PageMessage";
import { MAIN_NAV, NEW_PATIENT_PERMISSION, PHONE_TABS, visibleNav } from "../ui/shell/nav-items";
import { StaffShell } from "../ui/shell/StaffShell";

// Screens behind the nav items that later tasks will build.
const NOT_BUILT = ["appointments", "billing", "messages", "reports"];

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
    >
      <Routes>
        <Route index element={home} />
        <Route path="patients" element={<PatientsScreen />} />
        <Route path="patients/new" element={<NewPatientScreen />} />
        <Route path="patients/:id/consents" element={<PatientConsentsScreen />} />
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
