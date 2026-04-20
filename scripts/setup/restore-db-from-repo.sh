#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_SYNC_DIR="$PROJECT_ROOT/db-sync"
DB_NAME="${DB_NAME:-apartment_fee_reviewer}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
POSTGRES_BIN_DIR="${POSTGRES_BIN_DIR:-$HOME/Applications/Postgres.app/Contents/Versions/17/bin}"
PSQL_BIN="$POSTGRES_BIN_DIR/psql"
SNAPSHOT_SQL="$DB_SYNC_DIR/${DB_NAME}.latest.sql"

if [[ ! -x "$PSQL_BIN" ]]; then
  echo "Khong tim thay psql tai: $PSQL_BIN"
  exit 1
fi

if [[ ! -f "$SNAPSHOT_SQL" ]]; then
  echo "Khong tim thay snapshot: $SNAPSHOT_SQL"
  exit 1
fi

"$PSQL_BIN" \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
  -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" \
  -c "CREATE DATABASE \"$DB_NAME\";"

"$PSQL_BIN" \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -v ON_ERROR_STOP=1 \
  -f "$SNAPSHOT_SQL"

echo "Da restore database tu snapshot:"
echo "- $SNAPSHOT_SQL"
