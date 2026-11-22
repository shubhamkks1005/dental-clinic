import type { Repos } from "@clinic/db";
import { InvalidError } from "@clinic/db";
import {
  FILE_MAX_BYTES,
  isAllowedFileMime,
  newUlid,
  type FileRow,
  type FileUploadMeta,
} from "@clinic/shared";
import type { StorageAdapter } from "../adapters/storage";
import { sha256Bytes } from "./files-hash";

export type UploadFileInput = FileUploadMeta & {
  patientId: string;
  bytes: Uint8Array;
  mime: string;
  originalFilename: string;
};

/** Put object then insert metadata. Object key is random (no patient name). */
export async function uploadPatientFile(
  repos: Repos,
  storage: StorageAdapter,
  input: UploadFileInput,
): Promise<FileRow> {
  if (!isAllowedFileMime(input.mime)) {
    throw new InvalidError("Use a JPEG, PNG, WebP or PDF file.");
  }
  if (input.bytes.byteLength === 0) throw new InvalidError("File is empty.");
  if (input.bytes.byteLength > FILE_MAX_BYTES) {
    throw new InvalidError("File must be 15 MB or smaller.");
  }
  const objectKey = `f/${newUlid()}`;
  const sha256 = await sha256Bytes(input.bytes);
  await storage.put(objectKey, input.bytes, input.mime);
  try {
    return await repos.files.insert({
      patientId: input.patientId,
      objectKey,
      kind: input.kind,
      mime: input.mime,
      bytes: input.bytes.byteLength,
      sha256,
      originalFilename: input.originalFilename,
      caption: input.caption ?? null,
      toothFdi: input.toothFdi ?? null,
      takenOn: input.takenOn ?? null,
    });
  } catch (err) {
    try {
      await storage.delete(objectKey);
    } catch {
      // best-effort cleanup
    }
    throw err;
  }
}
