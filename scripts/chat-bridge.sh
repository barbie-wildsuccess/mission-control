#!/bin/bash
# Chat Bridge: polls Convex for pending user messages, sends to OpenClaw, posts responses back.
# TODO: Set up as a launchd service for persistent operation.

CONVEX_URL="https://useful-leopard-418.convex.cloud"
POLL_INTERVAL=2

echo "🎀 Chat bridge started. Polling every ${POLL_INTERVAL}s..."

while true; do
  # Fetch pending messages
  PENDING=$(curl -s "${CONVEX_URL}/api/chat/pending")

  # Check if there are any messages (non-empty array)
  COUNT=$(echo "$PENDING" | jq 'length' 2>/dev/null)

  if [ "$COUNT" -gt 0 ] 2>/dev/null; then
    echo "$PENDING" | jq -c '.[]' | while read -r MSG; do
      MSG_ID=$(echo "$MSG" | jq -r '._id')
      MSG_TEXT=$(echo "$MSG" | jq -r '.text')

      echo "📨 Processing: $MSG_TEXT"

      # Send to OpenClaw and capture response
      RESPONSE=$(openclaw agent --session-id mc-chat --channel webchat "$MSG_TEXT" 2>/dev/null)

      if [ -n "$RESPONSE" ]; then
        echo "💬 Response: ${RESPONSE:0:80}..."

        # Post response back to Convex
        curl -s -X POST "${CONVEX_URL}/api/chat/respond" \
          -H "Content-Type: application/json" \
          -d "$(jq -n --arg text "$RESPONSE" '{text: $text}')" > /dev/null

        # Mark original message as processed
        curl -s -X POST "${CONVEX_URL}/api/chat/mark-processed" \
          -H "Content-Type: application/json" \
          -d "$(jq -n --arg id "$MSG_ID" '{id: $id}')" > /dev/null

        echo "✅ Processed message $MSG_ID"
      else
        echo "⚠️ Empty response from OpenClaw for message $MSG_ID"
      fi
    done
  fi

  sleep $POLL_INTERVAL
done
