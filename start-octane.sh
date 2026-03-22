#!/bin/bash
# ===================================================
# ECAB Octane Local Dev Startup Script (Linux / WSL2)
# ===================================================
# Prerequisites:
#   1. PHP 8.2+ with ext-pcntl enabled
#   2. Composer dependencies installed (composer install)
#   3. .env configured (DB, Redis, Reverb, Google Maps key)
#
# Usage:  bash start-octane.sh
# Stop:   Ctrl+C  (Octane handles graceful shutdown)

set -e

cd "$(dirname "$0")"

echo "🔧  Ensuring RoadRunner binary exists..."
if [ ! -f ./rr ]; then
    ./vendor/bin/rr get-binary
fi

echo "🧹  Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo "🚀  Starting Octane (RoadRunner) on port 8000..."
echo "    Workers: auto  |  Max requests per worker: 500"
echo "    Use Ctrl+C to stop."

php artisan octane:start \
    --server=roadrunner \
    --host=0.0.0.0 \
    --port=8000 \
    --workers=auto \
    --task-workers=auto \
    --max-requests=500 \
    --watch

