import { Navigate, Route, Routes } from "react-router";
import { NotFound } from "./NotFound";
import { PortalApp } from "./portal/PortalApp";
import { StaffApp } from "./staff/StaffApp";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/app/*" element={<StaffApp />} />
      <Route path="/my/*" element={<PortalApp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
