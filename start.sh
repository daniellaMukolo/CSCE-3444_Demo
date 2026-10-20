#!/usr/bin/env bash
# Starts the whole app on Replit (the Run button calls this; see .replit).
# 1. Flask backend on port 5000 (private)  2. React front end on port 5173 (the page you see).
# The first run installs packages and creates the demo data, so it takes a few minutes.
set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"

# If an earlier copy is still running (e.g. started from the Shell), stop it so the ports are free.
pkill -f "flask --app wellness" || true
# Match "vite.config.ts": the running process is "node .../vite.js --config vite.config.ts",
# so a pattern like "vite --config" misses it and the old copy keeps port 5173.
pkill -f "vite.config.ts" || true
# Wait (up to 10 seconds) until the old copies have let go of their ports.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if (exec 3<>/dev/tcp/127.0.0.1/5173) 2>/dev/null || (exec 3<>/dev/tcp/127.0.0.1/5000) 2>/dev/null; then
    sleep 1
  else
    break
  fi
done

echo "== Backend: Python packages"
python3 -c "import flask" 2>/dev/null \
  || python3 -m pip install -q -r wellness_planner/requirements.txt \
  || python3 -m pip install -q --user --break-system-packages -r wellness_planner/requirements.txt

# A random secret for signing login cookies, made once and kept in instance/ (never uploaded).
mkdir -p wellness_planner/instance
KEY_FILE=wellness_planner/instance/secret_key
[ -f "$KEY_FILE" ] || python3 -c "import secrets; print(secrets.token_hex(32))" > "$KEY_FILE"
export SECRET_KEY="$(cat "$KEY_FILE")"

cd "$ROOT/wellness_planner"
if [ ! -f instance/wellness.sqlite ]; then
  echo "== Backend: creating the database and demo account (first run only)"
  python3 -m flask --app wellness init-db
  python3 -m flask --app wellness seed-demo
fi

echo "== Backend: starting Flask on port 5000"
python3 -m flask --app wellness run --host 127.0.0.1 --port 5000 &
FLASK_PID=$!
trap 'kill $FLASK_PID 2>/dev/null' EXIT

cd "$ROOT/wellness_frontend"
# Check for vite itself, not just the folder, so a half-finished install is retried.
if [ ! -x artifacts/student-wellness-planner/node_modules/.bin/vite ]; then
  echo "== Front end: installing packages (first run only, a few minutes)"
  # Only the planner and what it uses; the unused Replit api-server needs a package Replit blocks.
  npx --yes pnpm@10.18.3 install --frozen-lockfile --filter "@workspace/student-wellness-planner..."
fi

echo "== Front end: starting on port 5173 (open the Webview / preview tab)"
cd artifacts/student-wellness-planner
PORT=5173 BASE_PATH=/ npx --yes pnpm@10.18.3 run dev
