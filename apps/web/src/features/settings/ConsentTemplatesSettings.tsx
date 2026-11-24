import {
  CONSENT_TEMPLATE_KEYS,
  resolveConsentTemplates,
  type ConsentTemplateKey,
  type ConsentTemplates,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getSetting, putSetting } from "./api";
import { Select, TextInput, Textarea } from "../../ui/form";

/** 3.8.1: edit consent templates. The doctor's forms are Hindi; lawyer confirms later. */
export function ConsentTemplatesSettings() {
  const [templates, setTemplates] = useState<ConsentTemplates | null>(null);
  const [version, setVersion] = useState(1);
  const [key, setKey] = useState<ConsentTemplateKey>("extraction");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSetting<unknown>("consent.templates")
      .then((row) => {
        setTemplates(resolveConsentTemplates(row.value));
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
        Consent forms are printed in Hindi, everything else in English. Lines: &quot;#
        Heading&quot;, &quot;## Sub heading&quot;, &quot;- bullet&quot;, &quot;1. numbered&quot;,
        &quot;[ ]&quot; for a tick box. Name, age, mobile, date, doctor and signature lines are
        added when printing.
      </p>
      <label>
        Template
        <Select
          value={key}
          onChange={(e) => setKey(e.target.value as ConsentTemplateKey)}
          disabled={busy}
        >
          {CONSENT_TEMPLATE_KEYS.map((k) => (
            <option key={k} value={k}>
              {templates[k].title}
            </option>
          ))}
        </Select>
      </label>
      <label>
        Title
        <TextInput
          value={current.title}
          disabled={busy}
          onChange={(e) =>
            setTemplates({ ...templates, [key]: { ...current, title: e.target.value } })
          }
        />
      </label>
      <label>
        Heading on the printed form
        <TextInput
          value={current.printTitle ?? ""}
          disabled={busy}
          onChange={(e) =>
            setTemplates({ ...templates, [key]: { ...current, printTitle: e.target.value } })
          }
        />
      </label>
      <label>
        Body
        <Textarea
          rows={16}
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
