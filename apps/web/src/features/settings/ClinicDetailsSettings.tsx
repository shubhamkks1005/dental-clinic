import { SETTING_HELP, type SettingKey } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { useMe } from "../auth";
import { getSetting, putSetting } from "./api";
import { TextInput, Textarea } from "../../ui/form";

type Field = { key: SettingKey; label: string; multiline?: boolean };

const FIELDS: Field[] = [
  { key: "clinic.name", label: "Clinic name" },
  { key: "clinic.tagline", label: "Tagline" },
  { key: "clinic.kind", label: "Kind of clinic" },
  { key: "clinic.address", label: "Address", multiline: true },
  { key: "clinic.phone", label: "Phone" },
  { key: "clinic.email", label: "Email" },
  { key: "clinic.instagram", label: "Instagram name" },
  { key: "doctor.name", label: "Doctor name" },
  { key: "doctor.qualifications", label: "Qualifications" },
  { key: "doctor.speciality", label: "Speciality" },
  { key: "doctor.extra_line", label: "Extra line under speciality" },
  { key: "doctor.registration_no", label: "Registration number" },
];

type Row = { value: string; version: number };

/** 6.5.1: clinic + doctor letterhead fields (S12). Logo upload stays deferred. */
export function ClinicDetailsSettings() {
  const canEdit = useMe().permissions.includes("settings.write");
  const [rows, setRows] = useState<Record<string, Row> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

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

  return (
    <section className="card settings-panel">
      <UnsavedChangesGuard dirty={dirty} />
      <h2>Clinic details</h2>
      <p className="muted">Shown on prescriptions, bills and receipts. Logo upload comes later.</p>
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      <div className="settings-fields">
        {FIELDS.map((f) => (
          <label key={f.key} className="settings-field">
            <span>{f.label}</span>
            {f.multiline ? (
              <Textarea
                className="input"
                rows={3}
                value={draft[f.key] ?? ""}
                disabled={!canEdit || busy}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            ) : (
              <TextInput
                className="input"
                value={draft[f.key] ?? ""}
                disabled={!canEdit || busy}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            )}
            <span className="muted settings-help">{SETTING_HELP[f.key]}</span>
          </label>
        ))}
      </div>
      {canEdit ? (
        <p className="settings-actions">
          <button
            type="button"
            className="btn"
            disabled={!dirty || busy}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          {saved ? <span className="muted">Saved.</span> : null}
        </p>
      ) : (
        <p className="muted">View only. Ask the doctor to change these.</p>
      )}
    </section>
  );
}
