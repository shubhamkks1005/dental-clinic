import { hasActiveConsent, PATIENT_FILE_KINDS, type PatientFileKind } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getPatientConsents } from "../patients/api";
import { uploadPatientFile } from "./api";
import { prepareImageForUpload } from "./prepare-image";
import { NativeInput, Select, TextInput } from "../../ui/form";

type Props = {
  patientId: string;
  allowedKinds: readonly PatientFileKind[];
  onUploaded: () => void;
};

export function FileUploadForm({ patientId, allowedKinds, onUploaded }: Props) {
  const [kind, setKind] = useState<PatientFileKind>(allowedKinds[0] ?? "scan");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [tooth, setTooth] = useState("");
  const [hasPhotoConsent, setHasPhotoConsent] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPatientConsents(patientId)
      .then((rows) => {
        if (!cancelled) setHasPhotoConsent(hasActiveConsent(rows, "photo"));
      })
      .catch(() => {
        if (!cancelled) setHasPhotoConsent(true);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  async function onPick(fileList: FileList | null) {
    const raw = fileList?.[0];
    if (!raw) return;
    setBusy(true);
    setError(null);
    setWarn(null);
    try {
      if (kind === "photo" && !hasPhotoConsent) {
        setWarn(
          "No photo consent on file. You can still upload for clinical records — record photo consent when you can. Marketing use needs a separate consent (lawyer to confirm).",
        );
      }
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
        <Select
          value={kind}
          onChange={(e) => setKind(e.target.value as PatientFileKind)}
          disabled={busy}
        >
          {kinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
      </label>
      <label>
        Caption
        <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} />
      </label>
      <label>
        Tooth (FDI)
        <TextInput
          inputMode="numeric"
          value={tooth}
          onChange={(e) => setTooth(e.target.value)}
          disabled={busy}
          placeholder="optional"
        />
      </label>
      <label className="file-upload-pick">
        Choose file
        <NativeInput
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={busy}
          onChange={(e) => void onPick(e.target.files)}
        />
      </label>
      {busy ? <p className="muted">Uploading…</p> : null}
      {warn ? (
        <p className="notice" role="status">
          {warn}
        </p>
      ) : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
