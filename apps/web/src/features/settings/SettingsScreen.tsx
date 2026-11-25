import { useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router";
import { useMe } from "../auth";
import { StaffSettings } from "../staff";
import { TimingsSettings } from "../timings";
import { NotBuiltYet, NotFound, PageMessage } from "../../ui/PageMessage";
import { BillingSettings } from "./BillingSettings";
import {
  filterLibraryHits,
  filterSettingsSections,
  SETTINGS_GROUPS,
  SETTINGS_REDIRECTS,
  SETTINGS_SECTIONS,
  type SettingsSectionDef,
} from "./catalog";
import { SetupProgress } from "./SetupProgress";
import { ClinicDetailsSettings } from "./ClinicDetailsSettings";
import { QrSettings } from "./QrSettings";
import { ConsentTemplatesSettings } from "./ConsentTemplatesSettings";
import { MessagingSettingsPanel } from "./MessagingSettingsPanel";
import { NumberSeriesSettings } from "./NumberSeriesSettings";
import { PreferencesSettings } from "./PreferencesSettings";
import { PrivacyNoticeSettings } from "./PrivacyNoticeSettings";
import { SystemStatusSettings } from "./SystemStatusSettings";
import "./settings.css";
import { TextInput } from "../../ui/form";

const BASE = "/app/settings";

const SCREENS: Record<string, ReactNode> = {
  clinic: (
    <>
      <ClinicDetailsSettings />
      <QrSettings />
    </>
  ),
  timings: <TimingsSettings />,
  billing: <BillingSettings />,
  staff: <StaffSettings />,
  consent: (
    <div className="settings-stack">
      <ConsentTemplatesSettings />
      <PrivacyNoticeSettings />
    </div>
  ),
  messages: <MessagingSettingsPanel />,
  system: <SystemStatusSettings />,
  advanced: (
    <div className="settings-stack">
      <PreferencesSettings />
      <NumberSeriesSettings />
      <Link to="/app/errors">Open the error log</Link>
    </div>
  ),
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
  const libraryHits = useMemo(
    () => (me.permissions.includes("settings.medicines") ? filterLibraryHits(query) : []),
    [me.permissions, query],
  );
  const first = visible[0];

  return (
    <div className="settings">
      <header className="settings-head">
        <h1>Settings</h1>
        <p className="muted">Everything on prescriptions, bills and screens comes from here.</p>
        <label className="settings-search">
          <span className="sr-only">Search settings</span>
          <TextInput
            className="input"
            type="search"
            placeholder="Search settings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
        {query.trim() && filtered.length + libraryHits.length > 0 ? (
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
            {libraryHits.map((h) => (
              <li key={h.to}>
                <button
                  type="button"
                  className="settings-hit"
                  onClick={() => {
                    setQuery("");
                    void navigate(h.to);
                  }}
                >
                  {h.label} <span className="muted small">in Library</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {query.trim() && filtered.length + libraryHits.length === 0 ? (
          <p className="muted">No settings match “{query.trim()}”.</p>
        ) : null}
      </header>
      <SetupProgress />
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
            {SETTINGS_SECTIONS.filter((s) => !visible.includes(s)).map((s) => (
              <Route
                key={s.path}
                path={s.path}
                element={
                  <PageMessage
                    title="Not available for your role"
                    text="You do not have permission to open this page. Ask the doctor if you need it."
                  />
                }
              />
            ))}
            {Object.entries(SETTINGS_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      )}
    </div>
  );
}
