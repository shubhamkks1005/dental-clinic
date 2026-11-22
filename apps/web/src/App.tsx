import { Route, Routes } from "react-router";
import { AccessDenied, LandingPage, RequireStaff } from "./features/auth";
import { PortalRoutes } from "./routes/PortalRoutes";
import { StaffRoutes } from "./routes/StaffRoutes";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { OfflineBanner } from "./ui/OfflineBanner";
import { NotFound } from "./ui/PageMessage";
import { TooltipProvider } from "./ui/Tooltip";

export function App() {
  return (
    <TooltipProvider>
      <>
        <OfflineBanner />
        <ErrorBoundary>
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
        </ErrorBoundary>
      </>
    </TooltipProvider>
  );
}
