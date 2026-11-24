import { SETTING_HELP } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { useMe } from "../auth";
import { getSetting, putSetting } from "./api";
import { Checkbox, Select } from "../../ui/form";

/** 6.5.1: billing.gst_mode + billing.shadow_series. */
export function BillingSettings() {
  const canEdit = useMe().permissions.includes("settings.write");
  const [gst, setGst] = useState<{ value: "off" | "on"; version: number } | null>(null);
  const [shadow, setShadow] = useState<{ value: boolean; version: number } | null>(null);
  const [draftGst, setDraftGst] = useState<"off" | "on">("off");
  const [draftShadow, setDraftShadow] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      getSetting<"off" | "on">("billing.gst_mode"),
      getSetting<boolean>("billing.shadow_series"),
    ])
      .then(([g, s]) => {
        setGst(g);
        setShadow(s);
        setDraftGst(g.value);
        setDraftShadow(s.value);
        setProblem(null);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);

  useEffect(load, [load]);

  const dirty =
    gst !== null && shadow !== null && (draftGst !== gst.value || draftShadow !== shadow.value);

  async function save() {
    if (!gst || !shadow || !canEdit) return;
    setBusy(true);
    setSaved(false);
    setProblem(null);
    try {
      let nextGst = gst;
      let nextShadow = shadow;
      if (draftGst !== gst.value) {
        nextGst = await putSetting("billing.gst_mode", draftGst, gst.version);
      }
      if (draftShadow !== shadow.value) {
        nextShadow = await putSetting("billing.shadow_series", draftShadow, shadow.version);
      }
      setGst(nextGst);
      setShadow(nextShadow);
      setDraftGst(nextGst.value);
      setDraftShadow(nextShadow.value);
      setSaved(true);
    } catch (err: unknown) {
      setProblem(problemText(err));
      load();
    } finally {
      setBusy(false);
    }
  }

  if (problem && !gst) {
    return (
      <section className="card settings-panel">
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      </section>
    );
  }
  if (!gst || !shadow) {
    return (
      <section className="card settings-panel">
        <p className="muted">Loading billing settings…</p>
      </section>
    );
  }

  return (
    <section className="card settings-panel">
      <UnsavedChangesGuard dirty={dirty} />
      <h2>Billing</h2>
      <p className="muted">
        DRAFT — accountant to confirm tax. Shadow series uses SB-/SR-/SF- so software numbers do not
        collide with paper books.
      </p>
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      <label className="settings-field">
        <span>GST / tax mode</span>
        <Select
          className="input"
          value={draftGst}
          disabled={!canEdit || busy}
          onChange={(e) => setDraftGst(e.target.value === "on" ? "on" : "off")}
        >
          <option value="off">Off (no tax on bills)</option>
          <option value="on">On</option>
        </Select>
        <span className="muted settings-help">{SETTING_HELP["billing.gst_mode"]}</span>
      </label>
      <label className="settings-field settings-field-check">
        <Checkbox
          checked={draftShadow}
          disabled={!canEdit || busy}
          onChange={(e) => setDraftShadow(e.target.checked)}
        />
        <span>Use shadow series (SB-/SR-/SF-)</span>
      </label>
      <p className="muted settings-help">{SETTING_HELP["billing.shadow_series"]}</p>
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
