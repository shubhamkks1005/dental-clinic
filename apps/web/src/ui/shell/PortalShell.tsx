import type { ReactNode } from "react";
import { Logo } from "../Logo";
import { sampleClinic } from "./sample-session";
import "./portal.css";

// Patient portal frame: phone first, read only (S18/S19 come with Phase 8).
export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="portal">
      <header className="portal-header">
        <Logo />
        <span className="portal-clinic">{sampleClinic.name}</span>
      </header>
      <main className="portal-main">{children}</main>
    </div>
  );
}
