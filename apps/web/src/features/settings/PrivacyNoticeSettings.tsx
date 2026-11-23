import { SETTING_HELP } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { useMe } from "../auth";
import { getSetting, putSetting } from "./api";

/** 6.5.1: privacy notice body + version (templates group). */
export function PrivacyNoticeSettings() {
  const canEdit = useMe().permissions.includes("settings.write");
  const [body, setBody] = useState<{ value: string; version: number } | null>(null);
  const [ver, setVer] = useState<{ value: number; version: number } | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftVer, setDraftVer] = useState(1);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      getSetting<string>("privacy_notice.body"),
      getSetting<number>("privacy_notice.version"),
    ])
      .then(([b, v]) => {
        setBody(b);
        setVer(v);
        setDraftBody(b.value);
        setDraftVer(v.value);
        setProblem(null);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);

  useEffect(load, [load]);

  const dirty =
    body !== null && ver !== null && (draftBody !== body.value || draftVer !== ver.value);

  async function save() {
    if (!body || !ver || !canEdit) return;
    setBusy(true);
    setSaved(false);
    setProblem(null);
    try {
      let nextBody = body;
      let nextVer = ver;
      if (draftBody !== body.value) {
        nextBody = await putSetting("privacy_notice.body", draftBody, body.version);
      }
      if (draftVer !== ver.value) {
        nextVer = await putSetting("privacy_notice.version", draftVer, ver.version);
      }
      setBody(nextBody);
      setVer(nextVer);
      setDraftBody(nextBody.value);
      setDraftVer(nextVer.value);
      setSaved(true);
    } catch (err: unknown) {
      setProblem(problemText(err));
      load();
    } finally {
      setBusy(false);
    }
  }

  if (problem && !body) {
    return (
      <section className="card settings-panel">
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      </section>
    );
  }
  if (!body || !ver) {
    return (
      <section className="card settings-panel">
        <p className="muted">Loading privacy notice…</p>
      </section>
    );
  }

  return (
    <section className="card settings-panel">
      <UnsavedChangesGuard dirty={dirty} />
      <h2>Privacy notice</h2>
      <p className="muted">Shown at registration. Bump the version when the text changes.</p>
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      <label className="settings-field">
        <span>Version</span>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min={1}
          value={draftVer}
          disabled={!canEdit || busy}
          onChange={(e) => setDraftVer(Number(e.target.value) || 1)}
        />
        <span className="muted settings-help">{SETTING_HELP["privacy_notice.version"]}</span>
      </label>
      <label className="settings-field">
        <span>Notice text</span>
        <textarea
          className="input"
          rows={10}
          value={draftBody}
          disabled={!canEdit || busy}
          onChange={(e) => setDraftBody(e.target.value)}
        />
        <span className="muted settings-help">{SETTING_HELP["privacy_notice.body"]}</span>
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
          {saved ? <span className="muted">Saved.</span> : null}
        </p>
      ) : (
        <p className="muted">View only.</p>
      )}
    </section>
  );
}
