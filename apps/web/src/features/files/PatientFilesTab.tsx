import { DOCUMENT_FILE_KINDS, type FileRow, type PatientFileKind } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { useMe } from "../auth";
import { listPatientFiles, softDeleteFile } from "./api";
import { FileGrid } from "./FileGrid";
import { FileUploadForm } from "./FileUploadForm";
import { FileViewer } from "./FileViewer";
import { StorageUsagePanel } from "./StorageUsagePanel";
import "./files.css";

type Props = { patientId: string };

/** 3.7.4 Files tab (S04/S17): grid + upload + viewer. */
export function PatientFilesTab({ patientId }: Props) {
  const { permissions } = useMe();
  const canClinical = permissions.includes("files.clinical");
  const canDocs = permissions.includes("files.documents");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storageMsg, setStorageMsg] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);

  const reload = useCallback(() => {
    setError(null);
    setStorageMsg(null);
    listPatientFiles(patientId)
      .then(setFiles)
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.code === "not_configured") {
          setStorageMsg("File storage is not set up yet.");
          setFiles([]);
          return;
        }
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not load files. Check the connection, then try again.",
        );
      });
  }, [patientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const allowedKinds: PatientFileKind[] = canClinical
    ? (["iopa", "opg", "photo", "scan", "consent", "other"] as const)
    : canDocs
      ? [...DOCUMENT_FILE_KINDS]
      : [];

  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1]!, id];
      return [...prev, id];
    });
  }

  const compareId =
    openId && compare.length === 2
      ? (compare.find((id) => id !== openId) ?? compare[0]!)
      : compare.length === 2
        ? compare[1]!
        : null;
  const primaryId = openId ?? (compare.length === 2 ? compare[0]! : null);

  async function onDelete(id: string) {
    if (!window.confirm("Remove this file from the list? (Soft delete — kept for audit.)")) return;
    try {
      await softDeleteFile(id);
      if (openId === id) setOpenId(null);
      setCompare((c) => c.filter((x) => x !== id));
      reload();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Could not remove the file.");
    }
  }

  if (!canClinical && !canDocs) {
    return <p className="muted">You do not have permission to view files.</p>;
  }

  return (
    <div className="patient-files">
      {canClinical ? <StorageUsagePanel /> : null}
      {storageMsg ? (
        <p className="notice" role="status">
          {storageMsg}
        </p>
      ) : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}

      {allowedKinds.length > 0 && !storageMsg ? (
        <FileUploadForm patientId={patientId} allowedKinds={allowedKinds} onUploaded={reload} />
      ) : null}

      <FileGrid
        files={files}
        selectedIds={compare}
        onOpen={(id) => setOpenId(id)}
        onToggleCompare={toggleCompare}
      />

      {primaryId ? (
        <FileViewer
          primaryId={primaryId}
          compareId={compareId && compareId !== primaryId ? compareId : null}
          onClose={() => setOpenId(null)}
        />
      ) : null}

      {openId ? (
        <p className="file-actions">
          <button type="button" className="danger" onClick={() => void onDelete(openId)}>
            Remove file
          </button>
        </p>
      ) : null}
    </div>
  );
}
