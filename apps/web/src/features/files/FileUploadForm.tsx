import { PATIENT_FILE_KINDS, type PatientFileKind } from "@clinic/shared";
import { useState } from "react";
import { ApiError } from "../../api/client";
import { uploadPatientFile } from "./api";
import { prepareImageForUpload } from "./prepare-image";

type Props = {
  patientId: string;
  allowedKinds: readonly PatientFileKind[];
  onUploaded: () => void;
};

export function FileUploadForm({ patientId, allowedKinds, onUploaded }: Props) {
  const [kind, setKind] = useState<PatientFileKind>(allowedKinds[0] ?? "scan");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [tooth, setTooth] = useState("");

  async function onPick(fileList: FileList | null) {
    const raw = fileList?.[0];
    if (!raw) return;
    setBusy(true);
    setError(null);
    try {
      const prepared = await prepareImageForUpload(raw, kind);
      await uploadPatientFile(patientId, {
        file: prepared.file,
        kind,
        caption: caption.trim() || undefined,
        toothFdi: tooth.trim() ? Number(tooth) : undefined,
        thumb: prepared.thumb,
      });
      setCaption("");
      setTooth("");
      onUploaded();
    } catch (e: unknown) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not upload the file. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const kinds = PATIENT_FILE_KINDS.filter((k) => allowedKinds.includes(k));

  return (
    <form className="file-upload" onSubmit={(e) => e.preventDefault()}>
      <label>
        Type
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as PatientFileKind)}
          disabled={busy}
        >
          {kinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label>
        Caption
        <input value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} />
      </label>
      <label>
        Tooth (FDI)
        <input
          inputMode="numeric"
          value={tooth}
          onChange={(e) => setTooth(e.target.value)}
          disabled={busy}
          placeholder="optional"
        />
      </label>
      <label className="file-upload-pick">
        Choose file
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={busy}
          onChange={(e) => void onPick(e.target.files)}
        />
      </label>
      {busy ? <p className="muted">Uploading…</p> : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
