#!/usr/bin/env bash
# 1.6.3 / 9.1.3 nightly D1 backup: export → integrity (+ billing) → age → B2 → Healthchecks.
# Secrets/vars from GitHub Action env. Never echo secret values or dump contents.
# BACKUP_DRY_RUN=1: fixture SQL, local out dir, no real B2/HC. Encrypt if age is on PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="${RUNNER_TEMP:-/tmp}/clinic-backup-${STAMP}"
mkdir -p "$WORK"
trap 'rm -rf "$WORK"' EXIT

DRY="${BACKUP_DRY_RUN:-0}"
EXPORT_SQL="$WORK/d1-${STAMP}.sql"
EXPORT_AGE="$WORK/d1-${STAMP}.sql.age"
REMOTE_NAME="d1-${STAMP}.sql.age"
SHA_FILE="$WORK/d1-${STAMP}.sha256"

if [ "$DRY" = "1" ]; then
  echo "dry-run: using fixture dump (no Cloudflare / B2 / Healthchecks secrets)"
  cp "$ROOT/scripts/backup/fixture-dump.sql" "$EXPORT_SQL"
else
  : "${CLOUDFLARE_API_TOKEN:?missing}"
  : "${CLOUDFLARE_ACCOUNT_ID:?missing}"
  : "${D1_DATABASE_NAME:?missing}"
  : "${AGE_RECIPIENT:?missing}"
  : "${B2_KEY_ID:?missing}"
  : "${B2_APPLICATION_KEY:?missing}"
  : "${B2_BUCKET:?missing}"
  : "${HEALTHCHECKS_BACKUP_URL:?missing}"

  WRANGLER_ENV="${WRANGLER_ENV:-staging}"
  echo "exporting D1 ${D1_DATABASE_NAME} (${WRANGLER_ENV})"
  (
    cd "$ROOT/apps/worker"
    export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
    pnpm wr d1 export "$D1_DATABASE_NAME" --remote --env "$WRANGLER_ENV" --output "$EXPORT_SQL" -y
  )
fi

echo "checking dump integrity (+ billing when tables exist)"
node "$ROOT/scripts/backup/integrity.mjs" "$EXPORT_SQL"

if [ "$DRY" = "1" ] && ! command -v age >/dev/null 2>&1; then
  OUT_DIR="${BACKUP_DRY_OUT:-$ROOT/scripts/backup/.dry-out}"
  mkdir -p "$OUT_DIR"
  BYTES="$(wc -c < "$EXPORT_SQL" | tr -d ' ')"
  echo "dry-run integrity ok size=${BYTES} (age not installed; encrypt/upload skipped)"
  echo "install age (brew install age) for full dry-run encrypt step"
  printf 'integrity-ok at=%s size=%s\n' "$STAMP" "$BYTES" > "$OUT_DIR/dry-run-integrity.txt"
  exit 0
fi

if [ "$DRY" = "1" ] && [ -z "${AGE_RECIPIENT:-}" ]; then
  age-keygen -o "$WORK/dry-run.age" 2>/dev/null
  AGE_RECIPIENT="$(grep '^age1' "$WORK/dry-run.age")"
fi

: "${AGE_RECIPIENT:?missing}"

echo "encrypting with age (public recipient only)"
age -r "$AGE_RECIPIENT" -o "$EXPORT_AGE" "$EXPORT_SQL"
rm -f "$EXPORT_SQL"

if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$EXPORT_AGE" | awk '{print $1}' > "$SHA_FILE"
elif command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$EXPORT_AGE" | awk '{print $1}' > "$SHA_FILE"
else
  echo "no sha256 tool" >&2
  exit 1
fi
CHECKSUM="$(cat "$SHA_FILE")"
BYTES="$(wc -c < "$EXPORT_AGE" | tr -d ' ')"

if [ "$DRY" = "1" ]; then
  OUT_DIR="${BACKUP_DRY_OUT:-$ROOT/scripts/backup/.dry-out}"
  mkdir -p "$OUT_DIR"
  cp "$EXPORT_AGE" "$OUT_DIR/$REMOTE_NAME"
  cp "$SHA_FILE" "$OUT_DIR/${REMOTE_NAME}.sha256"
  echo "dry-run ok file=${REMOTE_NAME} size=${BYTES} sha256=${CHECKSUM}"
  exit 0
fi

echo "uploading to B2"
export AWS_ACCESS_KEY_ID="$B2_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$B2_APPLICATION_KEY"
export AWS_DEFAULT_REGION="${B2_REGION:-auto}"
ENDPOINT="${B2_ENDPOINT:-https://s3.us-west-004.backblazeb2.com}"
aws s3 cp "$EXPORT_AGE" "s3://${B2_BUCKET}/d1/${REMOTE_NAME}" --endpoint-url "$ENDPOINT"
aws s3 cp "$SHA_FILE" "s3://${B2_BUCKET}/d1/${REMOTE_NAME}.sha256" --endpoint-url "$ENDPOINT"

echo "pinging Healthchecks (size + stamp only)"
curl -fsS -m 30 -X POST \
  -H "Content-Type: text/plain" \
  --data "ok size=${BYTES} at=${STAMP} file=${REMOTE_NAME} sha256=${CHECKSUM}" \
  "$HEALTHCHECKS_BACKUP_URL" >/dev/null

# Optional: signed ops status for doctor dashboard (9.1.10). Never logs secret.
if [ -n "${OPS_WEBHOOK_URL:-}" ] && [ -n "${OPS_WEBHOOK_SECRET:-}" ]; then
  node "$ROOT/scripts/backup/ops-ping.mjs" "$BYTES" "$REMOTE_NAME" "$CHECKSUM" \
    || echo "ops webhook ping failed (backup file still uploaded)"
fi

echo "backup ok ${REMOTE_NAME} (${BYTES} bytes)"
