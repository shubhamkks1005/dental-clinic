import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { listPatientFiles, type FileRow } from "../files";
import { createPastRecord } from "./api";

type Props = {
  patientId: string;
  onCreated: () => void;
};

/** 6.7.3: doctor-only past/paper note (S04/S17 History). */
export function AddPastRecordForm({ patientId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [recordedOn, setRecordedOn] = useState("");
  const [body, setBody] = useState("");
  const [fileId, setFileId] = useState("");
  const [scans, setScans] = useState<FileRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listPatientFiles(patientId)
      .then((files) => {
        if (!cancelled) {
          setScans(files.filter((f) => f.kind === "scan" || f.kind === "consent"));
        }
      })
      .catch(() => {
        if (!cancelled) setScans([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, patientId]);

  if (!open) {
    return (
      <button type="button" className="btn btn-compact" onClick={() => setOpen(true)}>
        Add past record
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await createPastRecord(patientId, {
        recordedOn,
        body,
        fileId: fileId.trim() || undefined,
      });
      setRecordedOn("");
      setBody("");
      setFileId("");
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save the past record. Check the connection, then try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="history-past-form" onSubmit={(e) => void onSubmit(e)}>
      <h3 className="title-sm">Add past record</h3>
      <p className="muted small">For old paper history. Shown as “Added later”.</p>
      <label>
        Date
        <input
          type="date"
          required
          value={recordedOn}
          onChange={(e) => setRecordedOn(e.target.value)}
        />
      </label>
      <label>
        Note
        <textarea
          required
          rows={3}
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What was on the paper chart"
        />
      </label>
      <label>
        Optional scan
        <select
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          aria-label="Optional scan"
        >
          <option value="">None</option>
          {scans.map((f) => (
            <option key={f.id} value={f.id}>
              {f.kind} · {f.originalFilename || f.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="history-past-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className="btn btn-compact"
          disabled={saving}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
