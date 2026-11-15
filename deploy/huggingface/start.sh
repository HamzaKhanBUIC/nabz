#!/usr/bin/env bash
# Start the API and the site; if either stops, exit so the Space restarts the container.
# API_PORT must match the API_PROXY_TARGET the site was built with.
set -u
cd "$(dirname "$0")/../.."

API_PORT="${API_PORT:-8787}"
APP_PORT="${APP_PORT:-7860}"

PORT="${API_PORT}" node_modules/.bin/tsx src/server.ts &
(cd frontend && exec node_modules/.bin/next start -H 0.0.0.0 -p "${APP_PORT}") &

wait -n
status=$?
echo "nabz: a process exited with status ${status}; stopping the container" >&2
kill 0 2>/dev/null
exit "${status}"
