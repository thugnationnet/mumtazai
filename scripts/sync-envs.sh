#!/bin/bash
# ============================================================
# sync-envs.sh — Upload ALL .env files directly to EC2
# Use this after updating any credentials/secrets locally.
# .env files are NOT in git — this is the only way to deploy them.
# Usage: ./scripts/sync-envs.sh
# ============================================================

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY="$REPO_ROOT/key-nan.pem"
HOST="ubuntu@ec2-54-219-195-222.us-west-1.compute.amazonaws.com"
RDIR="/home/ubuntu/mumtazai/backend"

ENV_FILES=(
  "backend/.env"
  "backend/universal-chat-backend/.env"
  "backend/canvas-backend/.env"
  "backend/canvas-studio-backend/.env"
  "backend/community-backend/.env"
  "backend/lab-backend/.env"
  "backend/live-support-backend/.env"
  "backend/tools-backend/.env"
  "backend/ai-studio-demo-backend/.env"
  "backend/maula-editor-backend/.env"
)

echo "==> Uploading .env files to EC2..."
for f in "${ENV_FILES[@]}"; do
  local_path="$REPO_ROOT/$f"
  remote_path="${f#backend/}"   # strip leading "backend/"
  if [ -f "$local_path" ]; then
    rsync -az -e "ssh -o StrictHostKeyChecking=no -i $KEY" \
      "$local_path" "$HOST:$RDIR/$remote_path"
    echo "  ✓ $f"
  else
    echo "  - skip (not found): $f"
  fi
done

echo ""
echo "==> Restarting all backends with new env..."
ssh -o StrictHostKeyChecking=no -i "$KEY" "$HOST" "
  pm2 restart all --update-env
  pm2 save
  pm2 list | grep -E 'online|error' | awk '{print \$2, \$10}'
"

echo ""
echo "Env sync complete!"
