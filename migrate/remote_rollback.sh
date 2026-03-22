#!/bin/bash

# Config
KEY=~/.ssh/timo-ssh-key.pem
EC2_USER=ec2-user
EC2_HOST=3.125.39.71
REMOTE_DIR=/usr/share/nginx/html
BACKUP_DIR=/home/ec2-user/backups

# List available backups
echo "📋 Available backups:"
ssh -i "$KEY" "$EC2_USER@$EC2_HOST" "ls -1t $BACKUP_DIR"

echo ""
read -p "Enter backup name to restore: " BACKUP_NAME

echo "⚠️  Restoring $BACKUP_NAME to $REMOTE_DIR ..."

ssh -i "$KEY" "$EC2_USER@$EC2_HOST" \
  "rm -rf $REMOTE_DIR/* && cp -r $BACKUP_DIR/$BACKUP_NAME/* $REMOTE_DIR/"

if [ $? -eq 0 ]; then
  echo "✅ Rollback successful."
else
  echo "❌ Rollback failed."
  exit 1
fi
