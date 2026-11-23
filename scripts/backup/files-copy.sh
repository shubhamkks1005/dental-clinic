#!/usr/bin/env bash
# 9.1.4: rclone copy from R2 → encrypted B2 (copy, not sync). Never prints secrets.
# BACKUP_DRY_RUN=1: copy FAKE fixture files into .dry-out and verify count.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DRY="${BACKUP_DRY_RUN:-0}"

if [ "$DRY" = "1" ]; then
  SRC="$ROOT/scripts/backup/fixtures/files"
  OUT="${BACKUP_DRY_OUT:-$ROOT/scripts/backup/.dry-out}/files-${STAMP}"
  mkdir -p "$OUT"
  # copy, not sync — deletes on source must not wipe destination in a real run either.
  cp -R "$SRC/." "$OUT/"
  COUNT="$(find "$OUT" -type f | wc -l | tr -d ' ')"
  echo "dry-run files copy ok count=${COUNT} at=${STAMP}"
  if [ "$COUNT" -lt 1 ]; then
    echo "expected at least one fixture file" >&2
    exit 1
  fi
  exit 0
fi

: "${R2_BUCKET:?missing}"
: "${B2_BUCKET:?missing}"
: "${B2_FILES_PREFIX:?missing}"
: "${HEALTHCHECKS_FILES_BACKUP_URL:?missing}"

# Remotes come from RCLONE_CONFIG_* env (GitHub Action). crypt remote name = crypt
echo "rclone copy r2:${R2_BUCKET} crypt: (copy only)"
rclone copy "r2:${R2_BUCKET}" "crypt:" --checkers 4 --transfers 4 --fast-list

# Sample verify: list count only (no object names with patient ids in logs if keys are opaque ULIDs).
SRC_COUNT="$(rclone size "r2:${R2_BUCKET}" --json | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);console.log(j.count??0)})")"
echo "source object count=${SRC_COUNT}"

curl -fsS -m 30 -X POST \
  -H "Content-Type: text/plain" \
  --data "ok files at=${STAMP} count=${SRC_COUNT}" \
  "$HEALTHCHECKS_FILES_BACKUP_URL" >/dev/null

echo "files backup ok"
