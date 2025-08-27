#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Checking for processes on port 3000..."

PIDS=$(lsof -ti:3000 2>/dev/null || true)

if [ -z "$PIDS" ]; then
  echo "✅ No processes found on port 3000"
  exit 0
fi

echo "⚠️  Found processes on port 3000: $PIDS"
echo "🔒 Only killing Node.js/Next.js processes..."

for PID in $PIDS; do
  if ps -p $PID -o comm= | grep -q "node\|next"; then
    echo "🔄 Killing Node.js process $PID..."
    kill -9 $PID 2>/dev/null || echo "⚠️  Process $PID already terminated"
  else
    echo "⚠️  Skipping non-Node process $PID (not a Next.js dev server)"
  fi
done

echo "✅ Port 3000 cleanup completed"

