#!/usr/bin/env bash
# CareerScope AI — local dev launcher (macOS / Linux / WSL)
# Starts the FastAPI backend on :8000 and the Vite dev server on :5173.
# Run from the repository root:  ./start.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== CareerScope AI local dev ==="

# 1. Environment file
if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "Created .env from .env.example — add your API keys (GROQ_API_KEY, SERPAPI_API_KEY)." >&2
fi

# 2. Backend virtualenv
VENV="$ROOT/backend/.venv"
if [ ! -x "$VENV/bin/python" ]; then
  echo "Creating backend virtualenv..."
  python3 -m venv "$VENV"
fi
"$VENV/bin/python" -m pip install --upgrade pip --quiet
"$VENV/bin/python" -m pip install -r "$ROOT/backend/requirements.txt" --quiet
echo "Backend dependencies ready."

# 3. Load .env (simple KEY=VALUE export; not handling quoted values)
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a

# 4. Frontend dependencies
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$ROOT/frontend" && npm install)
fi
echo "Frontend dependencies ready."

echo "Starting backend  -> http://localhost:8000  (/docs for API)"
echo "Starting frontend -> http://localhost:5173"

(cd "$ROOT/backend" && exec "$VENV/bin/python" -m uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT

cd "$ROOT/frontend"
exec npm run dev