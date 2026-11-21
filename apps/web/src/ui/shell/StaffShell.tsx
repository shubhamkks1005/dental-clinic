import type { ReactNode } from "react";
import { BottomTabs } from "./BottomTabs";
import { MainNav } from "./MainNav";
import { TopBar } from "./TopBar";
import "./nav.css";
import "./shell.css";

// Staff app frame (S01 laptop, S14 phone). Which parts show is decided by CSS breakpoints.
export function StaffShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <MainNav />
      <TopBar />
      <main className="shell-main">{children}</main>
      <BottomTabs />
    </div>
  );
}
