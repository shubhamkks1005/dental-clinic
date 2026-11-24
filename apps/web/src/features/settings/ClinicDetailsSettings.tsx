import { istDateTime, SETTING_HELP } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { useMe } from "../auth";
import { getSetting, putSetting } from "./api";
import { Select, TextInput, Textarea } from "../../ui/form";
import { ClinicPreview } from "./ClinicPreview";
import { clinicLastSaved } from "./clinic-last-saved";
import {
  ALL_CLINIC_FIELDS as FIELDS,
  CLINIC_FIELDS,
  DOCTOR_FIELDS,
  fieldWarnings,
  type ClinicField,
} from "./clinic-fields";
import { SettingHistoryPanel } from "./SettingHistoryPanel";

type Row = { value: string; version: number };

/** 6.5.1: clinic + doctor letterhead fields (S12). Logo upload stays deferred. */
export function ClinicDetailsSettings() {
  const canEdit = useMe().permissions.includes("settings.write");
  const [rows, setRows] = useState<Record<string, Row> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ at: string; byName: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyKey, setHistoryKey] = useState<ClinicField["key"]>("doctor.registration_no");

  const load = useCallback(() => {
    Promise.all(FIELDS.map((f) => getSetting<string>(f.key).then((r) => [f.key, r] as const)))
      .then((pairs) => {
        const next: Record<string, Row> = {};
        const d: Record<string, string> = {};
        for (const [key, r] of pairs) {
          const value = typeof r.value === "string" ? r.value : "";
          next[key] = { value, version: r.version };
          d[key] = value;
        }
        setRows(next);
        setDraft(d);
        setProblem(null);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    clinicLastSaved()
      .then(setLast)
      .catch(() => setLast(null));
  }, [saved]);

  const dirty =
    rows !== null && FIELDS.some((f) => (draft[f.key] ?? "") !== (rows[f.key]?.value ?? ""));

  async function save() {
    if (!rows || !canEdit) return;
    setBusy(true);
    setSaved(false);
    setProblem(null);
    try {
      const next = { ...rows };
      for (const f of FIELDS) {
        const cur = next[f.key];
        if (!cur) continue;
        if ((draft[f.key] ?? "") === cur.value) continue;
        const savedRow = await putSetting(f.key, draft[f.key] ?? "", cur.version);
        next[f.key] = {
          value: typeof savedRow.value === "string" ? savedRow.value : "",
          version: savedRow.version,
        };
      }
      setRows(next);
      setDraft(Object.fromEntries(FIELDS.map((f) => [f.key, next[f.key]?.value ?? ""])));
      setSaved(true);
    } catch (err: unknown) {
      setProblem(problemText(err));
      load();
    } finally {
      setBusy(false);
    }
  }

  if (problem && !rows) {
    return (
      <section className="card settings-panel">
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      </section>
    );
  }
  if (!rows) {
    return (
      <section className="card settings-panel">
        <p className="muted">Loading clinic details…</p>
      </section>
    );
  }

  const warnings = fieldWarnings(draft);
  const renderField = (f: ClinicField) => (
    <label key={f.key} className="settings-field">
      <span>{f.label}</span>
      {f.multiline ? (
        <Textarea
          className={`input${warnings[f.key] ? " input-warn" : ""}`}
          rows={3}
          value={draft[f.key] ?? ""}
          disabled={!canEdit || busy}
          aria-describedby={warnings[f.key] ? `warn-${f.key}` : undefined}
          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
        />
      ) : (
        <TextInput
          className={`input${warnings[f.key] ? " input-warn" : ""}`}
          value={draft[f.key] ?? ""}
          disabled={!canEdit || busy}
          aria-describedby={warnings[f.key] ? `warn-${f.key}` : undefined}
          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
        />
      )}
      {warnings[f.key] ? (
        <span id={`warn-${f.key}`} className="settings-warn">
          {warnings[f.key]}
        </span>
      ) : (
        <span className="muted settings-help">{SETTING_HELP[f.key]}</span>
      )}
    </label>
  );

  return (
    <div className="clinic-two">
      <section className="card settings-panel">
        <UnsavedChangesGuard dirty={dirty} />
        <h2>Clinic and doctor</h2>
        <p className="muted small">
          {last ? (
            <>
              Last saved {istDateTime(new Date(last.at))} by {last.byName} ·{" "}
            </>
          ) : (
            "Not changed yet · "
          )}
          <button
            type="button"
            className="link-button"
            onClick={() => setShowHistory(!showHistory)}
          >
            History
          </button>
        </p>
        {problem ? (
          <p className="notice notice-error" role="alert">
            {problem}
          </p>
        ) : null}
        <h3 className="settings-part">Clinic</h3>
        <div className="settings-fields">{CLINIC_FIELDS.map(renderField)}</div>
        <h3 className="settings-part">Doctor</h3>
        <div className="settings-fields">{DOCTOR_FIELDS.map(renderField)}</div>
        {canEdit ? (
          <p className="settings-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!dirty || busy}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className="btn" disabled={!dirty || busy} onClick={load}>
              Cancel
            </button>
            {saved ? <span className="muted">Saved.</span> : null}
          </p>
        ) : (
          <p className="muted">View only. Ask the doctor to change these.</p>
        )}
        {showHistory ? (
          <>
            <label className="settings-field">
              <span>History of</span>
              <Select
                value={historyKey}
                onChange={(e) => setHistoryKey(e.target.value as ClinicField["key"])}
              >
                {FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </label>
            <SettingHistoryPanel key={historyKey} settingKey={historyKey} onRestored={load} />
          </>
        ) : null}
      </section>
      <ClinicPreview draft={draft} />
    </div>
  );
}
