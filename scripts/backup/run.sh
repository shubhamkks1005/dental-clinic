#!/usr/bin/env bash
# 1.6.3 nightly D1 backup: export → integrity → age encrypt → B2 upload → Healthchecks ping.
# Secrets/vars come from the GitHub Action environment. Never echo secret values.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="${RUNNER_TEMP:-/tmp}/clinic-backup-${STAMP}"
mkdir -p "$WORK"
trap 'rm -rf "$WORK"' EXIT

: "${CLOUDFLARE_API_TOKEN:?missing}"
: "${CLOUDFLARE_ACCOUNT_ID:?missing}"
: "${D1_DATABASE_NAME:?missing}"
: "${AGE_RECIPIENT:?missing}"
: "${B2_KEY_ID:?missing}"
: "${B2_APPLICATION_KEY:?missing}"
: "${B2_BUCKET:?missing}"
: "${HEALTHCHECKS_BACKUP_URL:?missing}"

WRANGLER_ENV="${WRANGLER_ENV:-staging}"
EXPORT_SQL="$WORK/d1-${STAMP}.sql"
EXPORT_AGE="$WORK/d1-${STAMP}.sql.age"
REMOTE_NAME="d1-${STAMP}.sql.age"

echo "exporting D1 ${D1_DATABASE_NAME} (${WRANGLER_ENV})"
(
  cd "$ROOT/apps/worker"
  # Token only in this process env; never printed.
  export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
  pnpm wr d1 export "$D1_DATABASE_NAME" --remote --env "$WRANGLER_ENV" --output "$EXPORT_SQL" -y
)

echo "checking dump integrity"
node "$ROOT/scripts/backup/integrity.mjs" "$EXPORT_SQL"

echo "encrypting with age (public recipient only)"
age -r "$AGE_RECIPIENT" -o "$EXPORT_AGE" "$EXPORT_SQL"
# Plain SQL must not leave the runner workspace after encrypt.
rm -f "$EXPORT_SQL"

echo "uploading to B2"
export AWS_ACCESS_KEY_ID="$B2_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$B2_APPLICATION_KEY"
export AWS_DEFAULT_REGION="${B2_REGION:-auto}"
ENDPOINT="${B2_ENDPOINT:-https://s3.us-west-004.backblazeb2.com}"
aws s3 cp "$EXPORT_AGE" "s3://${B2_BUCKET}/d1/${REMOTE_NAME}" --endpoint-url "$ENDPOINT"

BYTES="$(wc -c < "$EXPORT_AGE" | tr -d ' ')"
echo "pinging Healthchecks (size=${BYTES})"
# Body is size + stamp only — no patient data.
curl -fsS -m 30 -X POST \
  -H "Content-Type: text/plain" \
  --data "ok size=${BYTES} at=${STAMP} file=${REMOTE_NAME}" \
  "$HEALTHCHECKS_BACKUP_URL" >/dev/null

echo "backup ok ${REMOTE_NAME} (${BYTES} bytes)"
