#!/bin/bash

# Config
BACKUP_BASE=./migrate/local_backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="local_backup_$TIMESTAMP.tar.gz"
BACKUP_PATH="$BACKUP_BASE/$BACKUP_NAME"

mkdir -p "$BACKUP_BASE"

echo "📦 Creating local backup: $BACKUP_NAME"

tar -czf "$BACKUP_PATH" \
  src/ \
  dist/ \
  public/ \
  package.json \
  package-lock.json \
  vite.config.js \
  tailwind.config.js \
  postcss.config.js \
  eslint.config.js \
  index.html \
  .env 2>/dev/null || true

if [ $? -eq 0 ]; then
  echo "✅ Local backup saved to: $BACKUP_PATH"
else
  echo "❌ Local backup failed."
  exit 1
fi

# Keep only the 10 most recent local backups
ls -1t "$BACKUP_BASE"/*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f

echo "🧹 Old local backups cleaned up (keeping last 10)"
