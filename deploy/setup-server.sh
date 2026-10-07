#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04+ VPS (e.g. Hetzner Cloud). Run as root on the server;
# `bash deploy/deploy.sh setup` from your PC uploads and runs it for you. Safe to re-run.
#
# What it does:
#   - Node 22, swap, automatic security updates, Europe/Stockholm timezone
#   - a dedicated `cs2` user, app in /opt, data in /var/lib (deploys never touch the data)
#   - env file in /etc/cs2-skins-portfolio-tracker.env (API key, Discord webhook)
#   - systemd service (from cs2-skins-portfolio-tracker.service next to this script)
#   - Tailscale; the firewall only lets SSH in, and port 3000 is reachable only over Tailscale
#   - with DOMAIN set (e.g. DOMAIN=cs2.example.com): Caddy serves the app on https://DOMAIN with
#     an automatic certificate, ports 80/443 open, and the app gets a password (APP_PASSWORD).
#     Point the domain's A record at this server first.
#   - SSH: key login only (if root already has a key)
#   - daily tarball of the data dir in /var/backups/cs2-skins-portfolio-tracker (14 kept)
set -euo pipefail

APP_NAME=cs2-skins-portfolio-tracker
APP_USER=cs2
APP_DIR=/opt/$APP_NAME
DATA_DIR=/var/lib/$APP_NAME
ENV_FILE=/etc/$APP_NAME.env
BACKUP_DIR=/var/backups/$APP_NAME
PORT=3000
DOMAIN="${DOMAIN:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "Run as root."; exit 1; }
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a

step() { printf '\n=== %s\n' "$*"; }

# Set KEY=VALUE in the env file, replacing an existing line.
set_env() {
  if grep -q "^$1=" "$ENV_FILE"; then
    sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"
  fi
}

step "System packages"
apt-get update -q
apt-get upgrade -yq
apt-get install -yq curl ca-certificates ufw unattended-upgrades
timedatectl set-timezone Europe/Stockholm

step "Swap (2 GB)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
  sysctl -q -p /etc/sysctl.d/99-swappiness.conf
else
  echo "Swap already on."
fi

step "Node.js 22"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" != 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -yq nodejs
fi
node -v

step "App user and directories"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR" "$DATA_DIR" "$BACKUP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR" "$DATA_DIR"
chmod 750 "$DATA_DIR"

step "Tailscale"
if ! command -v tailscale >/dev/null; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi
if ! tailscale status >/dev/null 2>&1; then
  echo "Open the link below and log in with your Tailscale account to add this server:"
  tailscale up
fi
TS_NAME="$(tailscale status --json | sed -n 's/.*"DNSName": *"\([^"]*\)\.".*/\1/p' | head -n1)"
TS_IP="$(tailscale ip -4 | head -n1)"

step "Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow in on tailscale0
ufw --force enable
ufw status

step "SSH: key login only"
if [ -s /root/.ssh/authorized_keys ]; then
  # Sorts before Ubuntu's 50-cloud-init.conf, and sshd keeps the first value it reads.
  cat > /etc/ssh/sshd_config.d/10-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
  mkdir -p /run/sshd # Needed by the config check; socket-activated sshd may not have made it yet.
  sshd -t
  systemctl try-reload-or-restart ssh
  echo "Password login disabled."
else
  echo "No key in /root/.ssh/authorized_keys, leaving password login on. Add a key and re-run."
fi

step "Env file"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
# CS2 Skins Portfolio Tracker. Edit, then: systemctl restart $APP_NAME

# CSFloat API key: csfloat.com -> Profile -> Developers
CSFLOAT_API_KEY=

# Discord channel webhook: Channel settings -> Integrations -> Webhooks -> Copy URL
DISCORD_WEBHOOK_URL=

# Link target for "open in app" in Discord (Tailscale address of this server).
APP_URL=http://${TS_NAME:-$TS_IP}:$PORT

DATA_DIR=$DATA_DIR
TZ=Europe/Stockholm
CSFLOAT_MIN_INTERVAL_MS=2000
LOG_LEVEL=info
EOF
  echo "Created $ENV_FILE"
else
  echo "$ENV_FILE exists, left as is."
fi
chown root:"$APP_USER" "$ENV_FILE"
chmod 640 "$ENV_FILE"

if [ -n "$DOMAIN" ]; then
  step "HTTPS on $DOMAIN (Caddy) + password"
  apt-get install -yq caddy
  cat > /etc/caddy/Caddyfile <<EOF
# Managed by setup-server.sh. Caddy gets and renews the certificate on its own.
$DOMAIN {
	reverse_proxy localhost:$PORT
}
EOF
  systemctl enable caddy
  systemctl reload-or-restart caddy
  ufw allow 80/tcp
  ufw allow 443/tcp
  set_env APP_URL "https://$DOMAIN"
  NEW_PASSWORD=""
  if ! grep -q '^APP_PASSWORD=.' "$ENV_FILE"; then
    NEW_PASSWORD="$(openssl rand -base64 15 | tr '+/' '-_')"
    set_env APP_PASSWORD "$NEW_PASSWORD"
  fi
fi

step "systemd service"
sed -e "s|^User=.*|User=$APP_USER|" \
    -e "s|^WorkingDirectory=.*|WorkingDirectory=$APP_DIR|" \
    -e "s|^EnvironmentFile=.*|EnvironmentFile=$ENV_FILE|" \
    -e "s|^Environment=PORT=.*|Environment=PORT=$PORT|" \
    "$SCRIPT_DIR/$APP_NAME.service" > "/etc/systemd/system/$APP_NAME.service"
systemctl daemon-reload
systemctl enable "$APP_NAME"
if [ -f "$APP_DIR/server.js" ]; then
  systemctl restart "$APP_NAME"
fi

step "Daily data backup"
cat > "/usr/local/bin/$APP_NAME-backup" <<EOF
#!/bin/sh
# Tarball of the data dir; keeps 14 days. Temp files are half-written atomic writes.
set -e
tar -czf "$BACKUP_DIR/data-\$(date +%Y%m%d-%H%M).tar.gz" --exclude='*.tmp' -C "$DATA_DIR" .
find "$BACKUP_DIR" -name 'data-*.tar.gz' -mtime +14 -delete
EOF
chmod 755 "/usr/local/bin/$APP_NAME-backup"
cat > "/etc/systemd/system/$APP_NAME-backup.service" <<EOF
[Unit]
Description=Back up $APP_NAME data

[Service]
Type=oneshot
ExecStart=/usr/local/bin/$APP_NAME-backup
EOF
cat > "/etc/systemd/system/$APP_NAME-backup.timer" <<EOF
[Unit]
Description=Daily backup of $APP_NAME data

[Timer]
OnCalendar=*-*-* 04:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now "$APP_NAME-backup.timer"

step "Done"
[ -z "$DOMAIN" ] || echo "App:      https://$DOMAIN  (once DNS points here)"
[ -z "${NEW_PASSWORD:-}" ] || echo "Password: $NEW_PASSWORD  (APP_PASSWORD in the env file; any username)"
echo "App:      http://${TS_NAME:-$TS_IP}:$PORT  (from a device logged in to Tailscale)"
echo "Env file: $ENV_FILE  (add CSFLOAT_API_KEY and DISCORD_WEBHOOK_URL)"
echo "Data:     $DATA_DIR    Backups: $BACKUP_DIR"
[ -f "$APP_DIR/server.js" ] || echo "Next: deploy the app from your PC with: bash deploy/deploy.sh app"
