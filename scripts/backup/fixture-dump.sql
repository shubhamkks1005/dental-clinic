-- FAKE dump for local backup dry-run only. No real patient data.
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE settings (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER NOT NULL,
  key TEXT NOT NULL UNIQUE,
  value_json TEXT NOT NULL
);
CREATE TABLE counters (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  value INTEGER NOT NULL
);
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  request_id TEXT
);
CREATE TABLE access_log (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER NOT NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  request_id TEXT,
  detail TEXT
);
CREATE TABLE files (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER NOT NULL,
  patient_id TEXT,
  r2_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  sha256 TEXT
);
INSERT INTO users VALUES('u1','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z','system','system',NULL,1,'fake.doctor@example.com','Fake Doctor','doctor','active');
INSERT INTO settings VALUES('s1','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z','system','system',NULL,1,'clinic.name','"Fake Clinic"');
INSERT INTO counters VALUES('c1','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z','system','system',NULL,1,'patient_code','all',1);
COMMIT;
