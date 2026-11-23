import {
  DEFAULT_MESSAGING_SETTINGS,
  DRAFT_MESSAGE_TEMPLATES,
  type MessageTemplates,
  type MessagingSettings,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useToast } from "../../ui/Toast";
import { getSetting, putSetting } from "./api";

/** 7.4.2 / 7.4.3 Settings > Messages (S12). */
export function MessagingSettingsPanel() {
  const toast = useToast();
  const [settings, setSettings] = useState<MessagingSettings>(DEFAULT_MESSAGING_SETTINGS);
  const [templates, setTemplates] = useState<MessageTemplates>(DRAFT_MESSAGE_TEMPLATES);
  const [settingsVersion, setSettingsVersion] = useState(1);
  const [templatesVersion, setTemplatesVersion] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<keyof MessageTemplates["templates"]>("confirm");

  useEffect(() => {
    void Promise.all([getSetting("messaging.settings"), getSetting("messaging.templates")])
      .then(([s, t]) => {
        setSettings(s.value as MessagingSettings);
        setSettingsVersion(s.version);
        setTemplates(t.value as MessageTemplates);
        setTemplatesVersion(t.version);
      })
      .catch((err) => setError(problemText(err)));
  }, []);

  async function saveSettings() {
    try {
      const next = await putSetting("messaging.settings", settings, settingsVersion);
      setSettings(next.value as MessagingSettings);
      setSettingsVersion(next.version);
      toast({ text: "Messaging settings saved.", tone: "ok" });
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    }
  }

  async function saveTemplates() {
    try {
      const next = await putSetting("messaging.templates", templates, templatesVersion);
      setTemplates(next.value as MessageTemplates);
      setTemplatesVersion(next.version);
      toast({ text: "Templates saved.", tone: "ok" });
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    }
  }

  const preview = templates.templates[previewKey]
    .replace("{naam}", "Meena")
    .replace("{clinic}", "Align Dentistry")
    .replace("{din}", "Monday")
    .replace("{tareekh}", "24/11/2026")
    .replace("{samay}", "10:30 am")
    .replace("{fone}", "98765 43210")
    .replace("{otp}", "123456");

  return (
    <section className="card settings-panel stack gap-md">
      <h2>Messages</h2>
      <p className="muted">
        {templates.draftBanner}. Test mode stays dry_run — use Open WhatsApp to send.
      </p>
      {error && <p className="notice error">{error}</p>}

      <label className="row gap-sm">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
        />
        Messaging on
      </label>
      <label className="row gap-sm">
        <input
          type="checkbox"
          checked={settings.whatsappEnabled}
          onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
        />
        WhatsApp (manual wa.me)
      </label>
      <label className="stack gap-xs">
        <span>Day-before remind at (IST HH:MM)</span>
        <input
          className="input"
          value={settings.remindAtLocal}
          onChange={(e) => setSettings({ ...settings, remindAtLocal: e.target.value })}
        />
      </label>
      <label className="stack gap-xs">
        <span>Daily SMS segment cap</span>
        <input
          className="input"
          type="number"
          value={settings.smsDailyCap}
          onChange={(e) => setSettings({ ...settings, smsDailyCap: Number(e.target.value) || 60 })}
        />
      </label>
      <button type="button" className="btn primary" onClick={() => void saveSettings()}>
        Save messaging settings
      </button>

      <h3>Templates (English)</h3>
      <label className="stack gap-xs">
        <span>Edit template</span>
        <select
          className="input"
          value={previewKey}
          onChange={(e) => setPreviewKey(e.target.value as keyof MessageTemplates["templates"])}
        >
          {Object.keys(templates.templates).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <textarea
        className="input"
        rows={4}
        value={templates.templates[previewKey]}
        onChange={(e) =>
          setTemplates({
            ...templates,
            templates: { ...templates.templates, [previewKey]: e.target.value },
          })
        }
      />
      <p className="muted">Preview: {preview}</p>
      <button type="button" className="btn primary" onClick={() => void saveTemplates()}>
        Save templates
      </button>
      <button type="button" className="btn" onClick={() => setTemplates(DRAFT_MESSAGE_TEMPLATES)}>
        Reset to DRAFT defaults
      </button>
    </section>
  );
}
