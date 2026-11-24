import { TUNABLE_KEYS, TUNABLES, type TunableKey } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { useMe } from "../auth";
import { getSetting, putSetting } from "./api";
import { TextInput } from "../../ui/form";

type Row = { value: number; version: number };

/** 6.5.3: edit clinic tunables (min/max from TUNABLES). */
export function TunablesPanel() {
  const canEdit = useMe().permissions.includes("settings.write");
  const [rows, setRows] = useState<Record<TunableKey, Row> | null>(null);
  const [draft, setDraft] = useState<Record<TunableKey, number> | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    Promise.all(TUNABLE_KEYS.map((key) => getSetting<number>(key).then((r) => [key, r] as const)))
      .then((pairs) => {
        const next = {} as Record<TunableKey, Row>;
        const d = {} as Record<TunableKey, number>;
        for (const [key, r] of pairs) {
          next[key] = { value: r.value, version: r.version };
          d[key] = r.value;
        }
        setRows(next);
        setDraft(d);
        setProblem(null);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);

  useEffect(load, [load]);

  const dirty =
    rows !== null && draft !== null && TUNABLE_KEYS.some((k) => draft[k] !== rows[k]?.value);

  async function save() {
    if (!rows || !draft || !canEdit) return;
    setBusy(true);
    setSaved(false);
    setProblem(null);
    try {
      const next = { ...rows };
      for (const key of TUNABLE_KEYS) {
        const cur = next[key];
        if (!cur || draft[key] === cur.value) continue;
        const savedRow = await putSetting(key, draft[key], cur.version);
        next[key] = { value: savedRow.value as number, version: savedRow.version };
      }
      setRows(next);
      setDraft(
        Object.fromEntries(TUNABLE_KEYS.map((k) => [k, next[k].value])) as Record<
          TunableKey,
          number
        >,
      );
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
  if (!rows || !draft) {
    return (
      <section className="card settings-panel">
        <p className="muted">Loading limits…</p>
      </section>
    );
  }

  return (
    <section className="card settings-panel">
      <UnsavedChangesGuard dirty={dirty} />
      <h2>Clinic limits</h2>
      <p className="muted">
        Numbers the software used to hard-code. Each has a minimum and maximum.
      </p>
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      <div className="settings-fields">
        {TUNABLE_KEYS.map((key) => {
          const t = TUNABLES[key];
          return (
            <label key={key} className="settings-field">
              <span>
                {t.label}{" "}
                <span className="muted">
                  ({t.min}–{t.max})
                </span>
              </span>
              <TextInput
                className="input"
                type="number"
                inputMode="numeric"
                min={t.min}
                max={t.max}
                value={draft[key]}
                disabled={!canEdit || busy}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, [key]: Number(e.target.value) || t.min } : d))
                }
              />
              <span className="muted settings-help">{t.help}</span>
            </label>
          );
        })}
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
        <p className="muted">View only.</p>
      )}
    </section>
  );
}
