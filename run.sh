#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
SEED_MARKER="$ROOT_DIR/.seeded"

if [[ ! -f "$SEED_MARKER" ]]; then
  echo "Seeding database..."
  (
    cd "$BACKEND_DIR"
    npm run seed
  )
  touch "$SEED_MARKER"
else
  echo "Seed already completed once, skipping."
fi

echo "Starting backend and frontend..."

(
  cd "$BACKEND_DIR"
  npm run dev
) &
BACKEND_PID=$!

(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM
wait

