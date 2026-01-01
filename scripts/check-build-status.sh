#!/bin/bash

# Script to check the status of the latest GitHub Actions build
# Usage: ./scripts/check-build-status.sh

REPO="luisya22/kubernetes-training"

echo "🔍 Checking build status for ${REPO}..."
echo ""

# Get latest run
RUN_DATA=$(curl -s "https://api.github.com/repos/${REPO}/actions/runs?per_page=1")

# Extract info
RUN_NAME=$(echo "$RUN_DATA" | grep -m 1 '"name"' | cut -d'"' -f4)
STATUS=$(echo "$RUN_DATA" | grep -m 1 '"status"' | cut -d'"' -f4)
CONCLUSION=$(echo "$RUN_DATA" | grep -m 1 '"conclusion"' | cut -d'"' -f4)
HTML_URL=$(echo "$RUN_DATA" | grep -m 1 '"html_url"' | head -1 | cut -d'"' -f4)

echo "📦 Workflow: $RUN_NAME"
echo "📊 Status: $STATUS"

if [ "$STATUS" = "completed" ]; then
  if [ "$CONCLUSION" = "success" ]; then
    echo "✅ Result: SUCCESS!"
    echo ""
    echo "🎉 Your release is ready!"
    echo "   Release: https://github.com/${REPO}/releases"
    echo "   Download Page: https://luisya22.github.io/kubernetes-training/"
  elif [ "$CONCLUSION" = "failure" ]; then
    echo "❌ Result: FAILED"
    echo ""
    echo "Check the logs: $HTML_URL"
  else
    echo "⚠️  Result: $CONCLUSION"
  fi
else
  echo "⏳ Build is still running..."
  echo ""
  echo "Monitor progress: $HTML_URL"
  echo ""
  echo "Estimated time remaining: 10-15 minutes"
fi

echo ""
