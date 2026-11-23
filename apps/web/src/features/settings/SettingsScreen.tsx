import { LIST_KEYS } from "@clinic/shared";
import { useMemo, useState, type ReactNode } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router";
import { useMe } from "../auth";
import { ListEditor } from "../lists";
import { StaffSettings } from "../staff";
import { TimingsSettings } from "../timings";
import { NotBuiltYet, NotFound } from "../../ui/PageMessage";
import { BillingSettings } from "./BillingSettings";
import {
  filterSettingsSections,
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  type SettingsSectionDef,
} from "./catalog";
import { ClinicDetailsSettings } from "./ClinicDetailsSettings";
import { ConsentTemplatesSettings } from "./ConsentTemplatesSettings";
import { MedicinesListReview } from "./MedicinesListReview";
import { MessagesComingSoon } from "./MessagesComingSoon";
import { NumberSeriesSettings } from "./NumberSeriesSettings";
import { PreferencesSettings } from "./PreferencesSettings";
import { PrivacyNoticeSettings } from "./PrivacyNoticeSettings";
import { SystemStatusSettings } from "./SystemStatusSettings";
import "./settings.css";

const BASE = "/app/settings";

function listScreen(key: (typeof LIST_KEYS)[number]): ReactNode {
  if (key === "medicines") {
    return (
      <>
        <ListEditor listKey="medicines" />
        <MedicinesListReview />
      </>
    );
  }
  return <ListEditor listKey={key} />;
}

const SCREENS: Record<string, ReactNode> = {
  clinic: <ClinicDetailsSettings />,
  timings: <TimingsSettings />,
  billing: <BillingSettings />,
  "consent-templates": <ConsentTemplatesSettings />,
  "privacy-notice": <PrivacyNoticeSettings />,
  staff: <StaffSettings />,
  preferences: <PreferencesSettings />,
  numbers: <NumberSeriesSettings />,
  system: <SystemStatusSettings />,
  messages: <MessagesComingSoon />,
  ...Object.fromEntries(LIST_KEYS.map((key) => [key, listScreen(key)])),
};

/** S12 Settings hub (6.5.1): groups + search; any section within three clicks. */
export function SettingsScreen() {
  const me = useMe();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => SETTINGS_SECTIONS.filter((s) => me.permissions.includes(s.permission)),
    [me.permissions],
  );
  const filtered = useMemo(() => filterSettingsSections(visible, query), [visible, query]);
  const first = filtered[0] ?? visible[0];

  return (
    <div className="settings">
      <header className="settings-head">
        <h1>Settings</h1>
        <p className="muted">Everything on prescriptions, bills and screens comes from here.</p>
        <label className="settings-search">
          <span className="sr-only">Search settings</span>
          <input
            className="input"
            type="search"
            placeholder="Search settings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
        {query.trim() && filtered.length > 0 ? (
          <ul className="settings-search-hits" role="listbox" aria-label="Matching settings">
            {filtered.map((s) => (
              <li key={s.path}>
                <button
                  type="button"
                  className="settings-hit"
                  onClick={() => {
                    setQuery("");
                    void navigate(`${BASE}/${s.path}`);
                  }}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {query.trim() && filtered.length === 0 ? (
          <p className="muted">No settings match “{query.trim()}”.</p>
        ) : null}
      </header>
      {first === undefined ? (
        <NotBuiltYet />
      ) : (
        <div className="settings-body">
          <nav className="card settings-nav" aria-label="Settings sections">
            {SETTINGS_GROUPS.map((g) => {
              const items = filtered.filter((s) => s.group === g.id);
              if (items.length === 0) return null;
              return (
                <div key={g.id} className="settings-nav-group">
                  <p className="settings-nav-label">{g.label}</p>
                  {items.map((s) => (
                    <NavLink key={s.path} to={`${BASE}/${s.path}`}>
                      {s.label}
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </nav>
          <Routes>
            <Route index element={<Navigate to={`${BASE}/${first.path}`} replace />} />
            {visible.map((s: SettingsSectionDef) => (
              <Route key={s.path} path={s.path} element={SCREENS[s.path] ?? <NotFound />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      )}
    </div>
  );
}
