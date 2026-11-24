import { SETTING_HELP, type ChartView } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { useMe } from "../auth";
import { getSetting, putSetting } from "./api";
import { TunablesPanel } from "./TunablesPanel";
import { Select } from "../../ui/form";

/** 6.5.1 / 6.5.3 / 6.5.5: chart prefs + clinic tunables. */
export function PreferencesSettings() {
  const canEdit = useMe().permissions.includes("settings.write");
  const [row, setRow] = useState<{ value: ChartView; version: number } | null>(null);
  const [draft, setDraft] = useState<ChartView>({ facing: "dentist", notation: "fdi" });
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    getSetting<ChartView>("chart.view")
      .then((r) => {
        setRow(r);
        setDraft(r.value);
        setProblem(null);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);

  useEffect(load, [load]);

  const dirty =
    row !== null && (draft.facing !== row.value.facing || draft.notation !== row.value.notation);

  async function save() {
    if (!row || !canEdit) return;
    setBusy(true);
    setSaved(false);
    setProblem(null);
    try {
      const next = await putSetting("chart.view", draft, row.version);
      setRow(next);
      setDraft(next.value);
      setSaved(true);
    } catch (err: unknown) {
      setProblem(problemText(err));
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-stack">
      <section className="card settings-panel">
        <UnsavedChangesGuard dirty={dirty} />
        <h2>Preferences</h2>
        <p className="muted">{SETTING_HELP["chart.view"]}</p>
        {problem ? (
          <p className="notice notice-error" role="alert">
            {problem}
          </p>
        ) : null}
        {!row ? (
          <p className="muted">Loading preferences…</p>
        ) : (
          <>
            <label className="settings-field">
              <span>Chart facing</span>
              <Select
                className="input"
                value={draft.facing}
                disabled={!canEdit || busy}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    facing: e.target.value === "patient" ? "patient" : "dentist",
                  }))
                }
              >
                <option value="dentist">Dentist view (R = patient's right)</option>
                <option value="patient">Patient view</option>
              </Select>
            </label>
            <label className="settings-field">
              <span>Tooth notation</span>
              <Select
                className="input"
                value={draft.notation}
                disabled={!canEdit || busy}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    notation: v === "universal" || v === "palmer" ? v : "fdi",
                  }));
                }}
              >
                <option value="fdi">FDI</option>
                <option value="universal">Universal</option>
                <option value="palmer">Palmer</option>
              </Select>
            </label>
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
                {saved ? <span className="muted">Saved. Open a chart to see labels.</span> : null}
              </p>
            ) : (
              <p className="muted">View only.</p>
            )}
          </>
        )}
      </section>
      <TunablesPanel />
    </div>
  );
}
