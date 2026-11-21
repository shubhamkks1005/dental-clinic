import { Route, Routes } from "react-router";
import { NotFound, PageMessage } from "../ui/PageMessage";
import { PortalShell } from "../ui/shell/PortalShell";

// Read-only patient portal. Sign in (S18) and home (S19) come in Phase 8.
export function PortalRoutes() {
  return (
    <PortalShell>
      <Routes>
        <Route
          index
          element={
            <PageMessage
              title="Your records"
              text="Your appointments, prescriptions and bills will show here. To change anything, call the clinic."
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PortalShell>
  );
}
