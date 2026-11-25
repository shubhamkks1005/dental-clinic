import type { FileRecord, Repos } from "@clinic/db";
import { NotFoundError } from "@clinic/db";
import { parseSaveAnnotations, type FileRow } from "@clinic/shared";
import type { StorageAdapter } from "../adapters/storage";
import { uploadPatientFile, type UploadFileInput } from "./files-upload";

export const listPatientFiles = (repos: Repos, patientId: string): Promise<FileRow[]> =>
  repos.files.listForPatient(patientId);

export const getPatientFile = (repos: Repos, id: string): Promise<FileRecord> =>
  repos.files.getById(id);

export const viewPatientFile = (repos: Repos, id: string): Promise<FileRecord> =>
  repos.files.recordView(id);

export const softDeletePatientFile = (repos: Repos, id: string): Promise<void> =>
  repos.files.softDelete(id);

export const storageUsageBytes = (repos: Repos): Promise<number> => repos.files.totalBytes();

export const uploadFile = (
  repos: Repos,
  storage: StorageAdapter,
  input: UploadFileInput,
): Promise<FileRow> => uploadPatientFile(repos, storage, input);

export async function readFileBytes(
  repos: Repos,
  storage: StorageAdapter,
  id: string,
  opts?: { thumb?: boolean },
): Promise<{ row: FileRecord; body: ReadableStream | ArrayBuffer; contentType: string }> {
  const row = await repos.files.recordView(id);
  const key = opts?.thumb && row.thumbKey ? row.thumbKey : row.objectKey;
  const obj = await storage.get(key);
  if (!obj) throw new NotFoundError("File");
  return {
    row,
    body: obj.body,
    contentType: opts?.thumb ? "image/jpeg" : obj.contentType || row.mime,
  };
}

// B8: marks on an X-ray or photo (doctor only; the repo checks files.clinical).
export async function getFileAnnotations(repos: Repos, fileId: string) {
  return repos.fileAnnotations.get(fileId);
}

export async function saveFileAnnotations(repos: Repos, fileId: string, body: unknown) {
  const parsed = parseSaveAnnotations(body);
  if (!parsed.ok) return parsed;
  const saved = await repos.fileAnnotations.save(
    fileId,
    parsed.value.version,
    parsed.value.annotations,
  );
  return { ok: true as const, saved };
}
