#!/usr/bin/env node
// 1.6.3: load a D1 SQL export into a throwaway SQLite DB and refuse a bad dump.
// Usage: node scripts/backup/integrity.mjs path/to/export.sql
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

const REQUIRED = ["users", "settings", "counters", "audit_log", "access_log", "files"];

export function checkDumpSql(sql) {
  const path = join(tmpdir(), `clinic-backup-check-${process.pid}-${Date.now()}.db`);
  const db = new DatabaseSync(path);
  try {
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(sql);
    const integrity = db.prepare("PRAGMA integrity_check").get();
    const ok = integrity && Object.values(integrity)[0] === "ok";
    if (!ok) throw new Error(`integrity_check failed: ${JSON.stringify(integrity)}`);
    const names = new Set(
      db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((r) => r.name),
    );
    const missing = REQUIRED.filter((t) => !names.has(t));
    if (missing.length) throw new Error(`Dump is missing tables: ${missing.join(", ")}`);
    return { tables: [...names].sort() };
  } finally {
    db.close();
    try {
      unlinkSync(path);
    } catch {
      /* ignore */
    }
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/backup/integrity.mjs path/to/export.sql");
    process.exit(2);
  }
  const result = checkDumpSql(readFileSync(file, "utf8"));
  console.log(JSON.stringify({ ok: true, ...result }));
}
