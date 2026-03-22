#!/bin/bash

# Config
KEY=~/.ssh/timo-ssh-key.pem
EC2_USER=ec2-user
EC2_HOST=3.125.39.71
REMOTE_DIR=/usr/share/nginx/html
BACKUP_DIR=/home/ec2-user/backups

# Timestamp for the backup folder
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_$TIMESTAMP"

echo "📦 Creating backup: $BACKUP_NAME"

ssh -i "$KEY" "$EC2_USER@$EC2_HOST" \
  "mkdir -p $BACKUP_DIR && cp -r $REMOTE_DIR $BACKUP_DIR/$BACKUP_NAME"

if [ $? -eq 0 ]; then
  echo "✅ Backup successful: $BACKUP_DIR/$BACKUP_NAME"
else
  echo "❌ Backup failed. Aborting."
  exit 1
fi

# Keep only the 10 most recent backups
ssh -i "$KEY" "$EC2_USER@$EC2_HOST" \
  "ls -1t $BACKUP_DIR | tail -n +11 | xargs -I {} rm -rf $BACKUP_DIR/{}"

echo "🧹 Old backups cleaned up (keeping last 10)"
