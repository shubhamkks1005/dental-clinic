/** Bytes in private object storage; never a public URL. */

export type StoredObject = {
  body: ReadableStream | ArrayBuffer;
  contentType: string;
  size: number;
};

export type StorageAdapter = {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
};

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("File storage is not set up yet.");
    this.name = "StorageNotConfiguredError";
  }
}
