#!/usr/bin/env bash
# Deploy to a VPS from your PC (Git Bash on Windows works; needs only ssh and tar).
#
#   bash deploy/deploy.sh setup    one-time server setup (runs deploy/setup-server.sh on the server)
#   bash deploy/deploy.sh app      build and ship the app, then restart it
#   bash deploy/deploy.sh data     replace the server's data with your local data/ (asks first)
#   bash deploy/deploy.sh backup   download a fresh backup of the server's data
#   bash deploy/deploy.sh logs     follow the app's logs
#
# Settings come from the environment or .env.local: DEPLOY_HOST (SSH target, e.g.
# root@157.180.80.31) and optionally DEPLOY_DOMAIN (e.g. cs2.example.com: HTTPS + password).
set -euo pipefail
cd "$(dirname "$0")/.."

APP_NAME=cs2-skins-portfolio-tracker
APP_DIR=/opt/$APP_NAME
DATA_DIR=/var/lib/$APP_NAME
BACKUP_DIR=/var/backups/$APP_NAME

case "${1:-}" in
  setup | app | data | backup | logs) ;;
  *) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac

# Value of KEY from the environment, else from .env.local.
setting() {
  if [ -n "${!1:-}" ]; then echo "${!1}"; return; fi
  if [ -f .env.local ]; then sed -n "s/^$1=\(.*\)$/\1/p" .env.local | tr -d '\r"' | tail -n1; fi
}
DEPLOY_HOST="$(setting DEPLOY_HOST)"
DEPLOY_DOMAIN="$(setting DEPLOY_DOMAIN)"
[ -n "${DEPLOY_HOST:-}" ] || { echo "Set DEPLOY_HOST (e.g. root@157.180.80.31) in .env.local or the environment."; exit 1; }

# Upload a local file with Windows line endings stripped.
upload() { tr -d '\r' < "$1" | ssh "$DEPLOY_HOST" "cat > '$2'"; }

case "${1:-}" in
  setup)
    ssh "$DEPLOY_HOST" "mkdir -p /root/$APP_NAME-setup"
    upload deploy/setup-server.sh "/root/$APP_NAME-setup/setup-server.sh"
    upload "deploy/$APP_NAME.service" "/root/$APP_NAME-setup/$APP_NAME.service"
    ssh -t "$DEPLOY_HOST" "DOMAIN='$DEPLOY_DOMAIN' bash /root/$APP_NAME-setup/setup-server.sh"
    ;;

  app)
    bash deploy/package.sh
    echo "Uploading to $DEPLOY_HOST ..."
    tar -C dist --exclude='./.env*' -czf - . | ssh "$DEPLOY_HOST" "set -e
      rm -rf $APP_DIR.new && mkdir $APP_DIR.new
      tar --no-same-owner -xzf - -C $APP_DIR.new
      chown -R cs2:cs2 $APP_DIR.new
      rm -rf $APP_DIR.old
      [ -d $APP_DIR ] && mv $APP_DIR $APP_DIR.old
      mv $APP_DIR.new $APP_DIR
      systemctl restart $APP_NAME
      sleep 3
      systemctl is-active $APP_NAME"
    echo "Deployed. Previous version kept in $APP_DIR.old on the server."
    ;;

  data)
    [ -d data ] || { echo "No local data/ directory."; exit 1; }
    read -r -p "Replace ALL data on $DEPLOY_HOST with your local data/? The server's current data is backed up first. [y/N] " ok
    [ "$ok" = y ] || [ "$ok" = Y ] || { echo "Cancelled."; exit 1; }
    tar -C data --exclude='*.tmp' -czf - . | ssh "$DEPLOY_HOST" "set -e
      systemctl stop $APP_NAME
      /usr/local/bin/$APP_NAME-backup
      find $DATA_DIR -mindepth 1 -delete
      tar --no-same-owner -xzf - -C $DATA_DIR
      chown -R cs2:cs2 $DATA_DIR
      systemctl start $APP_NAME"
    echo "Data uploaded. The server's previous data is in $BACKUP_DIR."
    ;;

  backup)
    dest="$HOME/$APP_NAME-backups"
    mkdir -p "$dest"
    file="$dest/server-$(date +%Y%m%d-%H%M%S).tar.gz"
    ssh "$DEPLOY_HOST" "tar -czf - --exclude='*.tmp' -C $DATA_DIR ." > "$file"
    echo "Saved $file"
    ;;

  logs)
    ssh -t "$DEPLOY_HOST" "journalctl -u $APP_NAME -f -n 100"
    ;;
esac
