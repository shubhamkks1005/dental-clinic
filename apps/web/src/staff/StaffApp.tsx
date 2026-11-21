import { Route, Routes } from "react-router";
import { AppShell, type NavItem } from "../layout/AppShell";
import { ExampleCards } from "../layout/ExampleCards";
import { NotFound } from "../NotFound";

const nav: NavItem[] = [{ to: "/app", label: "Home" }];

export function StaffApp() {
  return (
    <AppShell title="Staff app" nav={nav}>
      <Routes>
        <Route index element={<ExampleCards />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
