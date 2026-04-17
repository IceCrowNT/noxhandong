#!/usr/bin/env bash
set -euo pipefail

POSTGRES_MAJOR="${1:-17}"
DB_NAME="${2:-apartment_fee_reviewer}"
APP_BIN="${HOME}/Applications/Postgres.app/Contents/Versions/${POSTGRES_MAJOR}/bin"

if [[ ! -x "${APP_BIN}/createdb" ]]; then
  echo "Postgres.app binaries not found at ${APP_BIN}"
  exit 1
fi

if "${APP_BIN}/psql" -h localhost -p 5432 -U postgres -lqt | awk '{print $1}' | grep -qx "${DB_NAME}"; then
  echo "Database ${DB_NAME} already exists"
else
  "${APP_BIN}/createdb" -h localhost -p 5432 -U postgres "${DB_NAME}"
  echo "Database ${DB_NAME} created"
fi
