#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Always On — Mac Mini Worker Setup
# Run once from the monorepo root to install, start, and persist the worker.
#
# Usage:
#   cd ~/followflow-re
#   bash scripts/setup-mac-mini.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step()  { echo -e "\n${GREEN}▶${NC} ${BOLD}$1${NC}"; }
ok()    { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}!${NC} $1"; }
fatal() { echo -e "\n${RED}✗ ERROR:${NC} $1\n"; exit 1; }

# ── Resolve monorepo root ─────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo -e "\n${BOLD}Always On — Mac Mini Worker Setup${NC}"
echo    "  Root: $ROOT"

# ── 1. Check Node.js ──────────────────────────────────────────────────────────
step "1/6  Checking Node.js"
if ! command -v node &>/dev/null; then
  fatal "Node.js is not installed.\n\n  Install it from https://nodejs.org (LTS) or via Homebrew:\n    brew install node"
fi
NODE_VERSION=$(node --version)
ok "Node.js $NODE_VERSION found at $(command -v node)"

# ── 2. Install dependencies ───────────────────────────────────────────────────
step "2/6  Installing dependencies"
npm install --cache /tmp/npm-cache
ok "npm install complete"

# ── 3. Create logs directory ──────────────────────────────────────────────────
step "3/6  Creating logs directory"
mkdir -p "$ROOT/logs"
ok "logs/ directory ready at $ROOT/logs"

# ── 4. Install pm2 globally if not present ────────────────────────────────────
step "4/6  Checking pm2"
if command -v pm2 &>/dev/null; then
  ok "pm2 already installed ($(pm2 --version 2>/dev/null | tail -1))"
else
  warn "pm2 not found — installing globally"
  npm install -g pm2 --cache /tmp/npm-cache
  ok "pm2 installed ($(pm2 --version 2>/dev/null | tail -1))"
fi

# ── 5. Start worker with pm2 ─────────────────────────────────────────────────
step "5/6  Starting worker"
if pm2 describe always-on-worker &>/dev/null; then
  warn "Worker already registered — restarting with latest config"
  pm2 restart ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
ok "Worker is running"

# ── 6. Save pm2 process list ─────────────────────────────────────────────────
step "6/6  Saving pm2 process list"
pm2 save
ok "Process list saved"

# ── Auto-restart on reboot ────────────────────────────────────────────────────
echo -e "\n${YELLOW}${BOLD}AUTO-START ON REBOOT${NC}"
echo    "  pm2 needs one sudo command to register a LaunchAgent."
echo    "  Copy and run the line below:"
echo ""
pm2 startup 2>/dev/null | grep -E "sudo|To setup" || true
echo ""
echo    "  Then run:  pm2 save"

# ── Done ─────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}✓ Setup complete.${NC}\n"
echo    "  Worker is live. Useful commands:"
echo    ""
echo    "    pm2 logs always-on-worker          tail live logs"
echo    "    pm2 logs always-on-worker --lines 200  last 200 lines"
echo    "    pm2 status                         process status + uptime"
echo    "    pm2 restart always-on-worker       restart the worker"
echo    "    pm2 stop always-on-worker          stop without removing"
echo    "    pm2 monit                          live CPU / memory"
echo    ""
echo -e "  Log files: ${BOLD}$ROOT/logs/${NC}"
echo    "    worker-out.log   — stdout (scheduler tick output)"
echo    "    worker-error.log — stderr (errors and warnings)"
echo ""
