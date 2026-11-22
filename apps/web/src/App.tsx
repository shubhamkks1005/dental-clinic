import { Route, Routes } from "react-router";
import { AccessDenied, LandingPage, RequireStaff } from "./features/auth";
import { PortalRoutes } from "./routes/PortalRoutes";
import { StaffRoutes } from "./routes/StaffRoutes";
import { NotFound } from "./ui/PageMessage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/denied" element={<AccessDenied />} />
      <Route
        path="/app/*"
        element={
          <RequireStaff>
            <StaffRoutes />
          </RequireStaff>
        }
      />
      <Route path="/my/*" element={<PortalRoutes />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
