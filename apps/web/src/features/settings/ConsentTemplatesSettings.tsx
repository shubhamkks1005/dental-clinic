import {
  CONSENT_TEMPLATE_KEYS,
  type ConsentTemplateKey,
  type ConsentTemplates,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getSetting, putSetting } from "./api";

/** 3.8.1: edit DRAFT consent templates (English). Sister/lawyer confirm later. */
export function ConsentTemplatesSettings() {
  const [templates, setTemplates] = useState<ConsentTemplates | null>(null);
  const [version, setVersion] = useState(1);
  const [key, setKey] = useState<ConsentTemplateKey>("extraction");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSetting<ConsentTemplates>("consent.templates")
      .then((row) => {
        setTemplates(row.value);
        setVersion(row.version);
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : "Could not load templates.");
      });
  }, []);

  if (!templates && !error) return <p className="muted">Loading…</p>;
  if (!templates) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }

  const current = templates[key];

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const next = {
        ...templates!,
        [key]: { ...current, version: current.version + 1 },
      };
      const row = await putSetting<ConsentTemplates>("consent.templates", next, version);
      setTemplates(row.value);
      setVersion(row.version);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="consent-templates">
      <h2>Consent templates</h2>
      <p className="muted">
        English only. Text marked &quot;DRAFT - lawyer to confirm&quot; until sister and lawyer
        approve.
      </p>
      <label>
        Template
        <select
          value={key}
          onChange={(e) => setKey(e.target.value as ConsentTemplateKey)}
          disabled={busy}
        >
          {CONSENT_TEMPLATE_KEYS.map((k) => (
            <option key={k} value={k}>
              {templates[k].title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Title
        <input
          value={current.title}
          disabled={busy}
          onChange={(e) =>
            setTemplates({ ...templates, [key]: { ...current, title: e.target.value } })
          }
        />
      </label>
      <label>
        Body
        <textarea
          rows={10}
          value={current.body}
          disabled={busy}
          onChange={(e) =>
            setTemplates({ ...templates, [key]: { ...current, body: e.target.value } })
          }
        />
      </label>
      <p className="muted small">Template version (on save): {current.version}</p>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
        Save template
      </button>
      {saved ? <p className="muted">Saved.</p> : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
