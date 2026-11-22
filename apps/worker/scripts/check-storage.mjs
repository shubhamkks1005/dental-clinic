#!/usr/bin/env node
/**
 * Read-only-ish S3/B2 connection check: put → get → delete a tiny test object.
 * Never prints secret values. Loads vars from the environment (or .dev.vars manually).
 *
 * Usage (after setting keys in the shell, never commit them):
 *   S3_ENDPOINT=... S3_BUCKET=... S3_REGION=... S3_KEY_ID=... S3_APP_KEY=... \
 *     node apps/worker/scripts/check-storage.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { AwsClient } from "aws4fetch";

const here = dirname(fileURLToPath(import.meta.url));
const { normaliseS3Endpoint } = await import(
  pathToFileURL(join(here, "../src/adapters/s3-endpoint.ts")).href
);

const endpointRaw = process.env.S3_ENDPOINT?.trim();
const bucket = process.env.S3_BUCKET?.trim();
const region = process.env.S3_REGION?.trim() || "us-west-004";
const keyId = process.env.S3_KEY_ID?.trim();
const appKey = process.env.S3_APP_KEY?.trim();

if (!endpointRaw || !bucket || !keyId || !appKey) {
  console.error(
    "Missing S3_ENDPOINT, S3_BUCKET, S3_KEY_ID or S3_APP_KEY. Set them in the shell (not in the repo).",
  );
  process.exit(1);
}

const endpoint = normaliseS3Endpoint(endpointRaw);

const client = new AwsClient({
  accessKeyId: keyId,
  secretAccessKey: appKey,
  region,
  service: "s3",
});

const key = `clinic-storage-check/${Date.now()}.txt`;
const url = `${endpoint}/${encodeURIComponent(bucket)}/${key}`;
const body = "dental-clinic storage check";

const put = await client.fetch(url, {
  method: "PUT",
  headers: { "content-type": "text/plain" },
  body,
});
if (!put.ok) {
  console.error(`PUT failed: HTTP ${put.status}`);
  process.exit(1);
}

const get = await client.fetch(url, { method: "GET" });
if (!get.ok) {
  console.error(`GET failed: HTTP ${get.status}`);
  process.exit(1);
}
const text = await get.text();
if (text !== body) {
  console.error("GET body did not match PUT body.");
  process.exit(1);
}

const del = await client.fetch(url, { method: "DELETE" });
if (!del.ok && del.status !== 404) {
  console.error(`DELETE failed: HTTP ${del.status}`);
  process.exit(1);
}

console.log("OK: S3/B2 put → get → delete succeeded.");
console.log(`endpoint host: ${new URL(endpoint).host}`);
console.log(`bucket: ${bucket}`);
console.log(`region: ${region}`);
