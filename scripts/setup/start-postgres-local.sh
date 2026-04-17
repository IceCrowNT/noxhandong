#!/usr/bin/env bash
set -euo pipefail

POSTGRES_MAJOR="${1:-17}"
APP_BIN="${HOME}/Applications/Postgres.app/Contents/Versions/${POSTGRES_MAJOR}/bin"
DATA_DIR="${HOME}/.local/share/apartment-fee-reviewer/postgres-data"
LOG_FILE="${HOME}/.local/share/apartment-fee-reviewer/postgres.log"

mkdir -p "$(dirname "${DATA_DIR}")"

if [[ ! -x "${APP_BIN}/pg_ctl" ]]; then
  echo "Postgres.app binaries not found at ${APP_BIN}"
  echo "Run scripts/setup/install-postgres-app-local.sh first."
  exit 1
fi

if [[ ! -f "${DATA_DIR}/PG_VERSION" ]]; then
  echo "Initializing postgres cluster at ${DATA_DIR}"
  LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 "${APP_BIN}/initdb" -D "${DATA_DIR}" --auth=trust --username=postgres
fi

echo "Starting postgres"
"${APP_BIN}/pg_ctl" -D "${DATA_DIR}" -l "${LOG_FILE}" start

echo "Postgres started. Log: ${LOG_FILE}"
