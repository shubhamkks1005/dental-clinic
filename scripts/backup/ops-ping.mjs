#!/usr/bin/env node
// 9.1.10: POST signed ops status. Never prints secret or dump contents.
// Usage: OPS_WEBHOOK_URL=… OPS_WEBHOOK_SECRET=… node ops-ping.mjs <sizeBytes> <file> <sha256>
import { Buffer } from "node:buffer";

const url = process.env.OPS_WEBHOOK_URL;
const secret = process.env.OPS_WEBHOOK_SECRET;
if (!url || !secret) {
  process.exit(0);
}

const sizeBytes = Number(process.argv[2] || 0);
const file = String(process.argv[3] || "");
const sha256hex = String(process.argv[4] || "");
const body = JSON.stringify({
  key: "backup_d1",
  status: "ok",
  checkedAt: new Date().toISOString(),
  detail: { sizeBytes, file, sha256: sha256hex },
});

const dig = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret}\n${body}`));
const sig = Buffer.from(dig)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-clinic-ops-signature": sig,
  },
  body,
});
if (!res.ok) {
  console.error(`ops webhook HTTP ${res.status}`);
  process.exit(1);
}
console.log("ops webhook ok");
