#!/bin/bash
# ============================================================
# deploy.sh — Push code to GitHub then pull & restart on EC2
# Usage: ./scripts/deploy.sh [optional commit message]
#
# GitHub auth: stores token in .github-token (gitignored).
# First run: create the file with: echo "ghp_YOUR_TOKEN" > scripts/.github-token
# ============================================================

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY="$REPO_ROOT/key-nan.pem"
HOST="ubuntu@ec2-54-219-195-222.us-west-1.compute.amazonaws.com"
REMOTE_DIR="/home/ubuntu/mumtazai"
TOKEN_FILE="$REPO_ROOT/scripts/.github-token"

MSG="${1:-Deploy: $(date '+%Y-%m-%d %H:%M')}"

echo "==> Staging & committing..."
cd "$REPO_ROOT"
git add -A
git diff --cached --quiet && echo "Nothing new to commit." || git commit -m "$MSG"

echo "==> Pushing to GitHub..."
if [ -f "$TOKEN_FILE" ]; then
  TOKEN="$(cat "$TOKEN_FILE" | tr -d '[:space:]')"
  git -c credential.helper= push \
    "https://x-access-token:${TOKEN}@github.com/thugnationnet/mumtazai.git" main
else
  git push origin main
fi

echo "==> Pulling on server & restarting..."
ssh -o StrictHostKeyChecking=no -i "$KEY" "$HOST" "
  cd $REMOTE_DIR
  git pull origin main
  pm2 restart all --update-env
  pm2 save
  echo '--- PM2 status ---'
  pm2 list | grep -E 'online|error' | awk '{print \$2, \$10}'
"

echo ""
echo "Deploy complete!"
