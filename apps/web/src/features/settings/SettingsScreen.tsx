import { LIST_DEFS, LIST_KEYS } from "@clinic/shared";
import type { ReactNode } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router";
import { useMe } from "../auth";
import { ListEditor } from "../lists";
import { StaffSettings } from "../staff";
import { TimingsSettings } from "../timings";
import { NotBuiltYet, NotFound } from "../../ui/PageMessage";
import "./settings.css";

type Section = { path: string; label: string; permission: string; screen: ReactNode };

// S12 Settings: a list of sections beside the open one. Each section shows only for the roles
// whose permission it needs; later tasks add clinic details, doctor, medicines and more.
const SECTIONS: Section[] = [
  { path: "timings", label: "Timings", permission: "settings.read", screen: <TimingsSettings /> },
  // One section per editable list in packages/shared/src/lists.ts (1.5.4): config only.
  ...LIST_KEYS.map((key) => ({
    path: key,
    label: LIST_DEFS[key].title,
    permission: "settings.read",
    screen: <ListEditor key={key} listKey={key} />,
  })),
  { path: "staff", label: "Staff", permission: "staff.manage", screen: <StaffSettings /> },
];
// Absolute: inside a splat route a relative link would resolve against the current sub-path.
const BASE = "/app/settings";

export function SettingsScreen() {
  const me = useMe();
  const sections = SECTIONS.filter((s) => me.permissions.includes(s.permission));
  const first = sections[0];

  return (
    <div className="settings">
      <header className="settings-head">
        <h1>Settings</h1>
        <p className="muted">Everything on prescriptions, bills and screens comes from here.</p>
      </header>
      {first === undefined ? (
        <NotBuiltYet />
      ) : (
        <div className="settings-body">
          <nav className="card settings-nav" aria-label="Settings sections">
            {sections.map((s) => (
              <NavLink key={s.path} to={`${BASE}/${s.path}`}>
                {s.label}
              </NavLink>
            ))}
          </nav>
          <Routes>
            <Route index element={<Navigate to={`${BASE}/${first.path}`} replace />} />
            {sections.map((s) => (
              <Route key={s.path} path={s.path} element={s.screen} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      )}
    </div>
  );
}
