#!/usr/bin/env bash
set -euo pipefail

POSTGRES_MAJOR="${1:-17}"
APP_BIN="${HOME}/Applications/Postgres.app/Contents/Versions/${POSTGRES_MAJOR}/bin"
DATA_DIR="${HOME}/.local/share/apartment-fee-reviewer/postgres-data"

if [[ ! -x "${APP_BIN}/pg_ctl" ]]; then
  echo "Postgres.app binaries not found at ${APP_BIN}"
  exit 1
fi

if [[ ! -f "${DATA_DIR}/PG_VERSION" ]]; then
  echo "No local postgres cluster found at ${DATA_DIR}"
  exit 0
fi

echo "Stopping postgres"
"${APP_BIN}/pg_ctl" -D "${DATA_DIR}" stop
