import { Navigate, Route, Routes } from "react-router";
import { PortalRoutes } from "./routes/PortalRoutes";
import { StaffRoutes } from "./routes/StaffRoutes";
import { NotFound } from "./ui/PageMessage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/app/*" element={<StaffRoutes />} />
      <Route path="/my/*" element={<PortalRoutes />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
