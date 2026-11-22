import type { FileRecord, Repos } from "@clinic/db";
import { NotFoundError } from "@clinic/db";
import type { FileRow } from "@clinic/shared";
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
): Promise<{ row: FileRecord; body: ReadableStream | ArrayBuffer; contentType: string }> {
  const row = await repos.files.recordView(id);
  const obj = await storage.get(row.objectKey);
  if (!obj) throw new NotFoundError("File");
  return { row, body: obj.body, contentType: obj.contentType || row.mime };
}
