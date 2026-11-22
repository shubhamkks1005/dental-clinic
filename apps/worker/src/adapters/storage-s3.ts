import { AwsClient } from "aws4fetch";
import { normaliseS3Endpoint } from "./s3-endpoint";
import type { StorageAdapter, StoredObject } from "./storage";
import { StorageNotConfiguredError } from "./storage";

export type S3Config = {
  endpoint: string;
  bucket: string;
  region: string;
  keyId: string;
  appKey: string;
};

export function s3ConfigReady(c: Partial<S3Config>): c is S3Config {
  return Boolean(c.endpoint && c.bucket && c.region && c.keyId && c.appKey);
}

/** Backblaze B2 (or any S3-compatible) via aws4fetch — no heavy SDK. */
export function s3Storage(config: S3Config): StorageAdapter {
  const client = new AwsClient({
    accessKeyId: config.keyId,
    secretAccessKey: config.appKey,
    region: config.region,
    service: "s3",
  });
  const base = normaliseS3Endpoint(config.endpoint);
  const objectUrl = (key: string) =>
    `${base}/${encodeURIComponent(config.bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;

  return {
    async put(key, bytes, contentType) {
      const res = await client.fetch(objectUrl(key), {
        method: "PUT",
        headers: { "content-type": contentType },
        body: bytes,
      });
      if (!res.ok) throw new Error(`Storage put failed (${res.status}).`);
    },
    async get(key): Promise<StoredObject | null> {
      const res = await client.fetch(objectUrl(key), { method: "GET" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Storage get failed (${res.status}).`);
      const size = Number(res.headers.get("content-length") ?? "0");
      return {
        body: res.body ?? new ArrayBuffer(0),
        contentType: res.headers.get("content-type") ?? "application/octet-stream",
        size,
      };
    },
    async delete(key) {
      const res = await client.fetch(objectUrl(key), { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error(`Storage delete failed (${res.status}).`);
    },
  };
}

export function requireS3Config(partial: Partial<S3Config>): S3Config {
  if (!s3ConfigReady(partial)) throw new StorageNotConfiguredError();
  return { ...partial, endpoint: normaliseS3Endpoint(partial.endpoint) };
}
