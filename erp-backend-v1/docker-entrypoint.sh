#!/bin/sh
# ==============================================================================
# ERP Backend — Docker Entrypoint
# Runs Prisma migrations then starts the NestJS server
# ==============================================================================

set -e

echo "================================================"
echo "  ERP Backend — Starting up"
echo "================================================"

# Run pending migrations
echo "[1/2] Running Prisma migrations..."
npx prisma migrate deploy
echo "  Migrations complete."

if [ "${SYNC_PERMISSIONS_ON_BOOT:-false}" = "true" ]; then
  echo "[2/3] Syncing permissions and role mappings..."
  node dist/src/database/seeders/permissions.seeder.js
  echo "  Permission sync complete."
  START_STEP="[3/3]"
else
  START_STEP="[2/2]"
fi

# Start app
echo "$START_STEP Starting NestJS application..."
exec node dist/src/main.js
