#!/bin/bash

# Script to call the sync approved/validated vacations API endpoint
# Usage: ./scripts/call-sync-api.sh [production|local]

ENV=${1:-production}

if [ "$ENV" = "local" ]; then
  URL="http://localhost:3000/api/sync/approved-requests"
  echo "🔄 Calling local API endpoint..."
else
  URL="https://vacation.stars.mc/api/sync/approved-requests"
  echo "🔄 Calling production API endpoint..."
fi

echo "📡 URL: $URL"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "📊 Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""
echo "📈 HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
  echo "✅ Sync completed successfully!"
else
  echo "❌ Sync failed with status $http_code"
  exit 1
fi

