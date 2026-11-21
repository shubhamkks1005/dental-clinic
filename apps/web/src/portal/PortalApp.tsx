import { Route, Routes } from "react-router";
import { AppShell, type NavItem } from "../layout/AppShell";
import { ExampleCards } from "../layout/ExampleCards";
import { NotFound } from "../NotFound";

const nav: NavItem[] = [{ to: "/my", label: "Home" }];

export function PortalApp() {
  return (
    <AppShell title="Patient portal" nav={nav}>
      <Routes>
        <Route index element={<ExampleCards />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
