#!/usr/bin/env bash
# =============================================================================
# Hassan portfolio — future deploy command (glimzo / hassaan.meetshahbaz.pk)
# =============================================================================
#
# SEARCH KEYWORDS (for Cursor / future “deploy” requests):
#   deploy hassaan
#   deploy glimzo
#   hassaan.meetshahbaz.pk
#   hassan-young-creators deploy
#   update production portfolio
#
# =============================================================================
# STRICT WORKFLOW RULE (DO NOT BREAK)
# =============================================================================
# 1) NEVER edit application code directly on the live server.
# 2) NEVER rsync local files onto the server for normal updates.
# 3) NEVER patch production by hand (no live nano/vim of app files).
# 4) ALL code/config changes happen LOCALLY in this repo first.
# 5) Then: commit -> push to GitHub main -> run this deploy script.
# 6) Server only does: git fetch/reset from GitHub + docker compose build.
# 7) Do NOT modify other projects on glimzo (nespak, meetshahbaz, n8n, etc.).
# 8) Server .env stays on the server only (never commit secrets).
# =============================================================================
#
# Public URL:
#   https://hassaan.meetshahbaz.pk/
#
# Integrated apps (same domain):
#   https://hassaan.meetshahbaz.pk/kidmind-ai
#   https://hassaan.meetshahbaz.pk/flash-cards
#
# GitHub repo:
#   https://github.com/shahbazalipk/hassan-young-creators
#
# Server:
#   SSH host alias: glimzo
#   App directory:  ~/hassan-portfolio
#
# USAGE (from local machine):
#   ./scripts/deploy-glimzo.sh
#   ./scripts/deploy-glimzo.sh --push     # push main then deploy
#   ./scripts/deploy-glimzo.sh --status   # check container + HTTPS only
#
# Proper channel:
#   local edit -> git commit -> git push origin main -> ./scripts/deploy-glimzo.sh
# =============================================================================

set -euo pipefail

SSH_HOST="${SSH_HOST:-glimzo}"
APP_DIR="${APP_DIR:-/home/ubuntu/hassan-portfolio}"
REPO_URL="${REPO_URL:-https://github.com/shahbazalipk/hassan-young-creators.git}"
BRANCH="${BRANCH:-main}"
PUBLIC_URL="${PUBLIC_URL:-https://hassaan.meetshahbaz.pk}"

mode="${1:-deploy}"

push_main_if_requested() {
  if [[ "$mode" == "--push" ]]; then
    echo "==> Pushing local ${BRANCH} to origin..."
    git push origin "$BRANCH"
  fi
}

remote_deploy() {
  echo "==> Deploying on ${SSH_HOST}:${APP_DIR} from GitHub (${BRANCH})..."
  echo "==> Reminder: live server is updated ONLY from GitHub via this script."
  ssh "$SSH_HOST" "bash -s" <<REMOTE
set -euo pipefail
APP_DIR="${APP_DIR}"
REPO_URL="${REPO_URL}"
BRANCH="${BRANCH}"

if [ ! -d "\$APP_DIR/.git" ]; then
  echo "Clone missing — cloning fresh from GitHub..."
  rm -rf "\$APP_DIR"
  git clone "\$REPO_URL" "\$APP_DIR"
fi

cd "\$APP_DIR"
git fetch origin "\$BRANCH"
git checkout "\$BRANCH"
git reset --hard "origin/\$BRANCH"
echo "Deploying commit: \$(git rev-parse --short HEAD)"

if [ ! -f .env ]; then
  echo "ERROR: \$APP_DIR/.env is missing on the server."
  echo "Create it before deploying (APP_URL, SESSION_SECRET, CSRF_SECRET, ADMIN_*)."
  exit 1
fi

mkdir -p public/uploads
touch public/uploads/.gitkeep

# Apply Hassan-only Apache configs from the repo (never edit other site configs).
if [ -f deploy/apache-hassaan.meetshahbaz.pk.conf ]; then
  sudo cp deploy/apache-hassaan.meetshahbaz.pk.conf /etc/apache2/sites-available/hassaan.meetshahbaz.pk.conf
fi
if [ -f deploy/apache-hassaan.meetshahbaz.pk-le-ssl.conf ]; then
  sudo cp deploy/apache-hassaan.meetshahbaz.pk-le-ssl.conf /etc/apache2/sites-available/hassaan.meetshahbaz.pk-le-ssl.conf
fi
sudo a2enmod proxy proxy_http headers rewrite ssl >/dev/null
sudo a2ensite hassaan.meetshahbaz.pk.conf >/dev/null || true
sudo a2ensite hassaan.meetshahbaz.pk-le-ssl.conf >/dev/null || true
sudo apache2ctl configtest
sudo systemctl reload apache2

docker compose up -d --build
docker compose ps

echo "==> Waiting for local app..."
for i in \$(seq 1 60); do
  if curl -fsS http://127.0.0.1:3000/ >/dev/null 2>&1; then
    echo "App is healthy on :3000"
    break
  fi
  sleep 2
  if [ "\$i" -eq 60 ]; then
    echo "App failed health check"
    docker compose logs --tail=100
    exit 1
  fi
done
REMOTE
}

verify_public() {
  echo "==> Verifying ${PUBLIC_URL} ..."
  curl -fsSI -A 'Mozilla/5.0' "$PUBLIC_URL/" | head -15
  curl -fsSI -A 'Mozilla/5.0' "$PUBLIC_URL/kidmind-ai" | head -12
  curl -fsSI -A 'Mozilla/5.0' "$PUBLIC_URL/flash-cards" | head -12
  echo
  echo "Hassan Portfolio URL: ${PUBLIC_URL}/"
}

status_only() {
  ssh "$SSH_HOST" "bash -s" <<REMOTE
set -euo pipefail
cd "${APP_DIR}"
echo "Commit: \$(git rev-parse --short HEAD)"
docker compose ps
curl -fsSI http://127.0.0.1:3000/ | head -10
REMOTE
  verify_public
}

case "$mode" in
  deploy|--deploy|"")
    remote_deploy
    verify_public
    ;;
  --push)
    push_main_if_requested
    remote_deploy
    verify_public
    ;;
  --status)
    status_only
    ;;
  *)
    echo "Unknown option: $mode"
    echo "Usage: $0 [--push|--status]"
    exit 1
    ;;
esac
