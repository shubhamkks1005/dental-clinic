import { Route, Routes } from "react-router";
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
  "settings",
  "more",
];

export function StaffRoutes() {
  return (
    <StaffShell>
      <Routes>
        <Route index element={<TodayScreen />} />
        {NOT_BUILT.map((path) => (
          <Route key={path} path={path} element={<NotBuiltYet />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </StaffShell>
  );
}
