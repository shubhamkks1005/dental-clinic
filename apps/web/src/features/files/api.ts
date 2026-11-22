import type { FileRow, PatientFileKind } from "@clinic/shared";
import { api, apiForm } from "../../api/client";

export type { FileRow };

export function fileContentUrl(id: string, thumb = false): string {
  return `/api/staff/files/${id}/content${thumb ? "?thumb=1" : ""}`;
}

export async function listPatientFiles(patientId: string): Promise<FileRow[]> {
  const data = await api<{ files: FileRow[] }>(`/api/staff/patients/${patientId}/files`);
  return data.files;
}

export async function uploadPatientFile(
  patientId: string,
  input: {
    file: File;
    kind: PatientFileKind;
    caption?: string;
    toothFdi?: number;
    takenOn?: string;
    thumb?: Blob | null;
  },
): Promise<FileRow> {
  const form = new FormData();
  form.set("file", input.file);
  form.set("kind", input.kind);
  if (input.caption) form.set("caption", input.caption);
  if (input.toothFdi !== undefined) form.set("toothFdi", String(input.toothFdi));
  if (input.takenOn) form.set("takenOn", input.takenOn);
  if (input.thumb) form.set("thumb", input.thumb, "thumb.jpg");
  const data = await apiForm<{ file: FileRow }>(`/api/staff/patients/${patientId}/files`, form);
  return data.file;
}

export async function softDeleteFile(id: string): Promise<void> {
  await api<{ deleted: boolean }>(`/api/staff/files/${id}`, { method: "DELETE" });
}

export async function getStorageUsage(): Promise<number> {
  const data = await api<{ bytes: number }>("/api/staff/storage/usage");
  return data.bytes;
}
