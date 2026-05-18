#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Missing DATABASE_URL" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-$PWD/.local/db-backups}"
mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d-%H%M%S)"
output_file="$BACKUP_DIR/apartment_fee_reviewer-$timestamp.dump"

pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$output_file"

echo "PostgreSQL backup written to: $output_file"
echo "Restore test command:"
echo "pg_restore --clean --if-exists --no-owner --dbname=\"\$DATABASE_URL\" \"$output_file\""
