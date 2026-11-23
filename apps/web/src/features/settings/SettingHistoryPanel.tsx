import type { SettingKey } from "@clinic/shared";
import { istDateTime } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { getSetting } from "./api";

type Entry = {
  id: string;
  at: string;
  byUserId: string;
  byName: string;
  beforeValue: unknown;
  afterValue: unknown;
  versionBefore: number;
  versionAfter: number;
};

function shortValue(value: unknown): string {
  if (typeof value === "string") return value.length > 80 ? `${value.slice(0, 77)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    const s = JSON.stringify(value);
    return s.length > 100 ? `${s.slice(0, 97)}…` : s;
  } catch {
    return "(value)";
  }
}

/** 6.5.2: past changes + one-click restore (new version). */
export function SettingHistoryPanel({
  settingKey,
  title = "Change history",
  onRestored,
}: {
  settingKey: SettingKey;
  title?: string;
  onRestored?: () => void;
}) {
  const canRestore = useMe().permissions.includes("settings.write");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [version, setVersion] = useState(1);
  const [problem, setProblem] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api<{ history: Entry[] }>(`/api/staff/settings/${settingKey}/history`),
      getSetting(settingKey),
    ])
      .then(([h, s]) => {
        setEntries(h.history);
        setVersion(s.version);
        setProblem(null);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, [settingKey]);

  useEffect(load, [load]);

  async function restore(entry: Entry) {
    if (!canRestore) return;
    setBusyId(entry.id);
    setProblem(null);
    try {
      await api(`/api/staff/settings/${settingKey}/restore`, {
        method: "POST",
        body: { auditId: entry.id, version },
      });
      load();
      onRestored?.();
    } catch (err: unknown) {
      setProblem(problemText(err));
      if (err instanceof ApiError && err.status === 409) load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="card settings-panel settings-history">
      <h3>{title}</h3>
      <p className="muted">Restore creates a new version. Old changes stay in the log.</p>
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      {entries === null ? (
        <p className="muted">Loading history…</p>
      ) : entries.length === 0 ? (
        <p className="muted">No changes yet.</p>
      ) : (
        <ul className="settings-history-list">
          {entries.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{e.byName}</strong>
                <span className="muted"> · {istDateTime(new Date(e.at))}</span>
                <p className="settings-history-values">
                  <span className="muted">Was</span> {shortValue(e.beforeValue)}
                  <span className="muted"> → </span>
                  {shortValue(e.afterValue)}
                </p>
              </div>
              {canRestore ? (
                <button
                  type="button"
                  className="btn"
                  disabled={busyId !== null}
                  onClick={() => void restore(e)}
                >
                  {busyId === e.id ? "Restoring…" : "Restore previous value"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
