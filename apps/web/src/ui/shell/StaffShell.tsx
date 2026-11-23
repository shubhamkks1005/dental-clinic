import type { ReactNode } from "react";
import { BottomTabs } from "./BottomTabs";
import { PageContainer } from "../page/Page";
import { MainNav } from "./MainNav";
import type { NavItem } from "./nav-items";
import { TopBar } from "./TopBar";
import "./nav.css";
import "./shell.css";

type Props = {
  children: ReactNode;
  mainNav: NavItem[];
  phoneTabs: NavItem[];
  canAddPatient: boolean;
  user: ReactNode;
  search: ReactNode;
};

// Staff app frame (S01 laptop, S14 phone). Which parts show is decided by CSS breakpoints.
// The caller passes only the menu items the signed-in role may use, and the user card.
export function StaffShell({ children, mainNav, phoneTabs, canAddPatient, user, search }: Props) {
  return (
    <div className="shell">
      <MainNav items={mainNav} user={user} />
      <TopBar canAddPatient={canAddPatient} user={user} search={search} />
      <main className="shell-main">
        <PageContainer>{children}</PageContainer>
      </main>
      <BottomTabs items={phoneTabs} canAddPatient={canAddPatient} />
    </div>
  );
}
