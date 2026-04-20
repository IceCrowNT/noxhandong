#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_SYNC_DIR="$PROJECT_ROOT/db-sync"
DB_NAME="${DB_NAME:-apartment_fee_reviewer}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
POSTGRES_BIN_DIR="${POSTGRES_BIN_DIR:-$HOME/Applications/Postgres.app/Contents/Versions/17/bin}"
PG_DUMP_BIN="$POSTGRES_BIN_DIR/pg_dump"

SNAPSHOT_SQL="$DB_SYNC_DIR/${DB_NAME}.latest.sql"
SNAPSHOT_META="$DB_SYNC_DIR/${DB_NAME}.latest.meta.json"

mkdir -p "$DB_SYNC_DIR"

if [[ ! -x "$PG_DUMP_BIN" ]]; then
  echo "Khong tim thay pg_dump tai: $PG_DUMP_BIN"
  exit 1
fi

"$PG_DUMP_BIN" \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --file "$SNAPSHOT_SQL"

cat > "$SNAPSHOT_META" <<EOF
{
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "port": "$DB_PORT",
  "user": "$DB_USER",
  "generatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "snapshotFile": "$(basename "$SNAPSHOT_SQL")"
}
EOF

echo "Da tao snapshot:"
echo "- $SNAPSHOT_SQL"
echo "- $SNAPSHOT_META"
