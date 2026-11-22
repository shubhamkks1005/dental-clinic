import { Route, Routes } from "react-router";
import { SettingsScreen } from "../features/settings";
import { TodayScreen } from "../features/today";
import { NotBuiltYet, NotFound } from "../ui/PageMessage";
import { StaffShell } from "../ui/shell/StaffShell";

// Screens behind the nav items that later tasks will build.
const NOT_BUILT = [
  "patients",
  "patients/new",
  "appointments",
  "billing",
  "messages",
  "reports",
  "more",
];

export function StaffRoutes() {
  return (
    <StaffShell>
      <Routes>
        <Route index element={<TodayScreen />} />
        <Route path="settings/*" element={<SettingsScreen />} />
        {NOT_BUILT.map((path) => (
          <Route key={path} path={path} element={<NotBuiltYet />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </StaffShell>
  );
}
