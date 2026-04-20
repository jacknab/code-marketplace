#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
#  Elite Marketplace — VPS Setup Script
#  Supports: Ubuntu 20.04 / 22.04 / 24.04
#            Debian 11 / 12
# ─────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log()     { echo -e "${GREEN}[✔]${RESET} $*"; }
info()    { echo -e "${CYAN}[→]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[!]${RESET} $*"; }
error()   { echo -e "${RED}[✘]${RESET} $*" >&2; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}━━━  $*  ━━━${RESET}\n"; }

# ─── Root check ───────────────────────────────
if [[ "$EUID" -ne 0 ]]; then
  error "Please run as root: sudo bash setup.sh"
fi

# ─── Detect OS ────────────────────────────────
if [[ -f /etc/os-release ]]; then
  source /etc/os-release
  OS_ID="$ID"
  OS_VERSION="$VERSION_ID"
else
  error "Cannot detect OS. This script requires Ubuntu or Debian."
fi

if [[ "$OS_ID" != "ubuntu" && "$OS_ID" != "debian" ]]; then
  error "Unsupported OS: $OS_ID. This script supports Ubuntu and Debian only."
fi

echo -e "\n${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║        Elite Marketplace — VPS Setup         ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${RESET}\n"

info "Detected OS: $OS_ID $OS_VERSION"

# ─────────────────────────────────────────────
# SECTION 1 — Gather configuration
# ─────────────────────────────────────────────
section "Configuration"

# App directory
read -rp "$(echo -e "${CYAN}App install directory${RESET} [/var/www/elite-marketplace]: ")" APP_DIR
APP_DIR="${APP_DIR:-/var/www/elite-marketplace}"

# Git repo or local copy
echo ""
echo "How would you like to get the application code?"
echo "  1) Clone from a Git repository"
echo "  2) Copy from a local path on this server"
read -rp "$(echo -e "${CYAN}Choice${RESET} [1]: ")" CODE_SOURCE
CODE_SOURCE="${CODE_SOURCE:-1}"

if [[ "$CODE_SOURCE" == "1" ]]; then
  read -rp "$(echo -e "${CYAN}Git repository URL${RESET}: ")" GIT_REPO
  [[ -z "$GIT_REPO" ]] && error "Git repository URL is required."
  read -rp "$(echo -e "${CYAN}Git branch${RESET} [main]: ")" GIT_BRANCH
  GIT_BRANCH="${GIT_BRANCH:-main}"
else
  read -rp "$(echo -e "${CYAN}Local path to project files${RESET}: ")" LOCAL_SRC
  [[ ! -d "$LOCAL_SRC" ]] && error "Directory not found: $LOCAL_SRC"
fi

# Domain / IP
echo ""
read -rp "$(echo -e "${CYAN}Domain name or server IP${RESET} (e.g. example.com or 1.2.3.4): ")" APP_DOMAIN
[[ -z "$APP_DOMAIN" ]] && error "Domain or IP is required."

# Port the Next.js app will listen on (internal)
APP_PORT=3000

# SSL
echo ""
read -rp "$(echo -e "${CYAN}Set up SSL with Let's Encrypt?${RESET} (requires a real domain, not an IP) [y/N]: ")" SETUP_SSL
SETUP_SSL="${SETUP_SSL:-n}"

if [[ "${SETUP_SSL,,}" == "y" ]]; then
  read -rp "$(echo -e "${CYAN}Email address for SSL certificate${RESET}: ")" SSL_EMAIL
  [[ -z "$SSL_EMAIL" ]] && error "Email is required for SSL."
fi

# Environment variables
section "Environment Variables"

read -rp "$(echo -e "${CYAN}GEMINI_API_KEY${RESET} (Google Gemini AI key): ")" GEMINI_API_KEY

echo ""
info "APP_URL will be set automatically based on your domain."
if [[ "${SETUP_SSL,,}" == "y" ]]; then
  APP_URL="https://${APP_DOMAIN}"
else
  APP_URL="http://${APP_DOMAIN}"
fi

# App user
APP_USER="elitemktp"

echo ""
echo -e "${BOLD}Summary:${RESET}"
echo "  Install dir : $APP_DIR"
echo "  Domain/IP   : $APP_DOMAIN"
echo "  App URL     : $APP_URL"
echo "  SSL         : ${SETUP_SSL^^}"
echo "  App user    : $APP_USER"
echo ""
read -rp "$(echo -e "${CYAN}Proceed with setup?${RESET} [Y/n]: ")" CONFIRM
CONFIRM="${CONFIRM:-y}"
[[ "${CONFIRM,,}" != "y" ]] && error "Setup cancelled."

# ─────────────────────────────────────────────
# SECTION 2 — System packages
# ─────────────────────────────────────────────
section "System Packages"

info "Updating package lists..."
apt-get update -qq

info "Installing required packages..."
apt-get install -y -qq \
  curl \
  git \
  nginx \
  ufw \
  build-essential \
  ca-certificates \
  gnupg \
  lsb-release

log "System packages installed."

# ─────────────────────────────────────────────
# SECTION 3 — Node.js 20
# ─────────────────────────────────────────────
section "Node.js 20"

if command -v node &>/dev/null && [[ "$(node -v)" == v20* ]]; then
  log "Node.js 20 already installed: $(node -v)"
else
  info "Installing Node.js 20 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  log "Node.js installed: $(node -v)"
fi

log "npm version: $(npm -v)"

# ─────────────────────────────────────────────
# SECTION 4 — PM2 process manager
# ─────────────────────────────────────────────
section "PM2 Process Manager"

if ! command -v pm2 &>/dev/null; then
  info "Installing PM2 globally..."
  npm install -g pm2 --silent
fi
log "PM2 version: $(pm2 -v)"

# ─────────────────────────────────────────────
# SECTION 5 — Application user
# ─────────────────────────────────────────────
section "Application User"

if id "$APP_USER" &>/dev/null; then
  info "User '$APP_USER' already exists."
else
  useradd --system --create-home --shell /bin/bash "$APP_USER"
  log "Created system user: $APP_USER"
fi

# ─────────────────────────────────────────────
# SECTION 6 — Deploy application code
# ─────────────────────────────────────────────
section "Application Code"

if [[ "$CODE_SOURCE" == "1" ]]; then
  if [[ -d "$APP_DIR/.git" ]]; then
    info "Repository already exists — pulling latest changes..."
    sudo -u "$APP_USER" git -C "$APP_DIR" fetch origin
    sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard "origin/$GIT_BRANCH"
  else
    info "Cloning repository into $APP_DIR..."
    mkdir -p "$(dirname "$APP_DIR")"
    sudo -u "$APP_USER" git clone --branch "$GIT_BRANCH" --depth 1 "$GIT_REPO" "$APP_DIR"
  fi
  log "Code deployed from Git."
else
  info "Copying files from $LOCAL_SRC to $APP_DIR..."
  mkdir -p "$APP_DIR"
  rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' "$LOCAL_SRC/" "$APP_DIR/"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
  log "Code copied from local path."
fi

# ─────────────────────────────────────────────
# SECTION 7 — Environment file
# ─────────────────────────────────────────────
section "Environment Variables"

ENV_FILE="$APP_DIR/.env.local"

cat > "$ENV_FILE" <<EOF
# Generated by setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
GEMINI_API_KEY=${GEMINI_API_KEY}
APP_URL=${APP_URL}
NODE_ENV=production
EOF

chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"
log "Environment file written to $ENV_FILE"

# ─────────────────────────────────────────────
# SECTION 8 — Update package.json scripts for port
# ─────────────────────────────────────────────
section "Port Configuration"

# Ensure Next.js listens on the internal port (3000 internally, nginx proxies it)
PKGJSON="$APP_DIR/package.json"
if grep -q '"dev":' "$PKGJSON"; then
  sed -i 's|"dev": "next dev.*"|"dev": "next dev -p '"$APP_PORT"' -H 0.0.0.0"|' "$PKGJSON"
fi
if grep -q '"start":' "$PKGJSON"; then
  sed -i 's|"start": "next start.*"|"start": "next start -p '"$APP_PORT"' -H 0.0.0.0"|' "$PKGJSON"
fi
log "Next.js configured to use port $APP_PORT."

# ─────────────────────────────────────────────
# SECTION 9 — Install dependencies & build
# ─────────────────────────────────────────────
section "Install Dependencies"

info "Running npm install..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm install --omit=dev 2>&1"
log "Dependencies installed."

section "Build"

info "Running next build (this may take a minute)..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run build 2>&1"
log "Build complete."

# ─────────────────────────────────────────────
# SECTION 10 — PM2 ecosystem file
# ─────────────────────────────────────────────
section "PM2 Configuration"

PM2_CONFIG="$APP_DIR/ecosystem.config.cjs"

cat > "$PM2_CONFIG" <<EOF
module.exports = {
  apps: [
    {
      name: 'elite-marketplace',
      cwd: '${APP_DIR}',
      script: 'node_modules/.bin/next',
      args: 'start -p ${APP_PORT} -H 0.0.0.0',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '${APP_PORT}',
      },
    },
  ],
};
EOF

chown "$APP_USER:$APP_USER" "$PM2_CONFIG"
log "PM2 ecosystem config written."

# Stop existing instance if running
pm2 delete elite-marketplace 2>/dev/null || true

info "Starting application with PM2..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start ecosystem.config.cjs"

# Save PM2 process list so it survives reboots
pm2 save
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | tail -1 | bash 2>/dev/null || true

log "Application started and registered with PM2."

# ─────────────────────────────────────────────
# SECTION 11 — nginx configuration
# ─────────────────────────────────────────────
section "nginx"

NGINX_CONF="/etc/nginx/sites-available/elite-marketplace"

cat > "$NGINX_CONF" <<EOF
# Elite Marketplace — nginx configuration
# Generated by setup.sh

upstream elite_marketplace {
    server 127.0.0.1:${APP_PORT};
    keepalive 64;
}

server {
    listen 80;
    server_name ${APP_DOMAIN};

    # Security headers
    add_header X-Content-Type-Options  "nosniff"         always;
    add_header X-Frame-Options         "SAMEORIGIN"       always;
    add_header X-XSS-Protection        "1; mode=block"    always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy      "geolocation=(), microphone=(), camera=()" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/rss+xml application/atom+xml image/svg+xml;

    # Static assets — served directly by nginx with long cache
    location /_next/static/ {
        alias ${APP_DIR}/.next/static/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Next.js app
    location / {
        proxy_pass         http://elite_marketplace;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # Block common attack paths
    location ~ /\.(?!well-known) {
        deny all;
    }
}
EOF

# Enable site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/elite-marketplace
# Remove default site if still enabled
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
log "nginx configured and reloaded."

# ─────────────────────────────────────────────
# SECTION 12 — SSL (optional)
# ─────────────────────────────────────────────
if [[ "${SETUP_SSL,,}" == "y" ]]; then
  section "SSL — Let's Encrypt"

  if ! command -v certbot &>/dev/null; then
    info "Installing Certbot..."
    apt-get install -y -qq certbot python3-certbot-nginx
  fi

  info "Obtaining SSL certificate for $APP_DOMAIN..."
  certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "$SSL_EMAIL" \
    --domains "$APP_DOMAIN" \
    --redirect

  # Auto-renewal cron (certbot usually sets this up, but make sure)
  systemctl enable certbot.timer 2>/dev/null || true

  log "SSL certificate installed. Auto-renewal is active."
fi

# ─────────────────────────────────────────────
# SECTION 13 — Firewall
# ─────────────────────────────────────────────
section "Firewall"

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
log "UFW firewall enabled (SSH + HTTP/HTTPS allowed)."

# ─────────────────────────────────────────────
# SECTION 14 — Health check
# ─────────────────────────────────────────────
section "Health Check"

info "Waiting for the app to become ready..."
sleep 4

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}" || echo "000")

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "304" ]]; then
  log "App is responding on port $APP_PORT (HTTP $HTTP_CODE)."
else
  warn "App returned HTTP $HTTP_CODE on port $APP_PORT."
  warn "Check logs with: pm2 logs elite-marketplace"
fi

# ─────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║           Setup complete!                    ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}App URL    :${RESET} ${APP_URL}"
echo -e "  ${BOLD}Install dir:${RESET} ${APP_DIR}"
echo -e "  ${BOLD}Env file   :${RESET} ${ENV_FILE}"
echo -e "  ${BOLD}PM2 config :${RESET} ${PM2_CONFIG}"
echo -e "  ${BOLD}nginx conf :${RESET} ${NGINX_CONF}"
echo ""
echo -e "${CYAN}Useful commands:${RESET}"
echo "  pm2 status                          — process status"
echo "  pm2 logs elite-marketplace          — live logs"
echo "  pm2 reload elite-marketplace        — zero-downtime reload"
echo "  pm2 restart elite-marketplace       — full restart"
echo "  nginx -t && systemctl reload nginx  — test & reload nginx"
echo ""
echo -e "${CYAN}To redeploy after a code update:${RESET}"
if [[ "$CODE_SOURCE" == "1" ]]; then
  echo "  cd $APP_DIR && git pull && npm install --omit=dev && npm run build && pm2 reload elite-marketplace"
else
  echo "  cd $APP_DIR && npm install --omit=dev && npm run build && pm2 reload elite-marketplace"
fi
echo ""
