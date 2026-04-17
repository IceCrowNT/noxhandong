#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-v2.9.4}"
POSTGRES_MAJOR="${2:-17}"
DMG_NAME="Postgres-${VERSION#v}-${POSTGRES_MAJOR}.dmg"
DOWNLOAD_URL="https://github.com/PostgresApp/PostgresApp/releases/download/${VERSION}/${DMG_NAME}"
DOWNLOAD_DIR="${HOME}/Downloads"
APP_DIR="${HOME}/Applications"
MOUNT_POINT=""

mkdir -p "${DOWNLOAD_DIR}" "${APP_DIR}"

echo "Downloading ${DOWNLOAD_URL}"
curl -L "${DOWNLOAD_URL}" -o "${DOWNLOAD_DIR}/${DMG_NAME}"

echo "Mounting DMG"
MOUNT_POINT="$(hdiutil attach "${DOWNLOAD_DIR}/${DMG_NAME}" | awk '/\/Volumes\// {print $3; exit}')"

if [[ -z "${MOUNT_POINT}" ]]; then
  echo "Failed to mount DMG"
  exit 1
fi

echo "Copying Postgres.app to ${APP_DIR}"
rm -rf "${APP_DIR}/Postgres.app"
ditto "${MOUNT_POINT}/Postgres.app" "${APP_DIR}/Postgres.app"

echo "Unmounting DMG"
hdiutil detach "${MOUNT_POINT}"

echo "Installed Postgres.app to ${APP_DIR}/Postgres.app"
