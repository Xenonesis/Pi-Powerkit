#!/usr/bin/env bash
set -e

PI_DIR="$HOME/.pi/agent"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
INTERACTIVE=true
[[ "$1" == "--no-interactive" ]] && INTERACTIVE=false

echo "================================================"
echo "   Pi-Powerkit - One-Click Setup"
echo "================================================"
echo ""

mkdir -p "$PI_DIR"/extensions "$PI_DIR"/cache

# 1. Bootstrap settings.json
if [ ! -f "$PI_DIR/settings.json" ]; then
  if [ -f "$SRC_DIR/bootstrap/settings.json" ]; then
    cp "$SRC_DIR/bootstrap/settings.json" "$PI_DIR/settings.json"
    echo "  -> settings.json created (default: opencode-zen/deepseek-v4-flash-free)"
  fi
else
  echo "  settings.json exists (skipped)"
fi

# 2. Source .env
ENV_FILE="$SRC_DIR/.env"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a && echo "  -> .env loaded"

# 3. Generate models.json from template
echo ""
echo "  Generating models.json..."
TEMPLATE=$(cat "$SRC_DIR/bootstrap/models.json")
for var in AIHUBMIX_API_KEY ROUTER9_API_KEY XIAOMI_API_KEY DATABRICKS_API_KEY MODAL_API_KEY KILO_API_KEY AGENTROUTER_API_KEY; do
  VAL="${!var}"
  if [ -z "$VAL" ] && [ "$INTERACTIVE" = true ]; then
    read -rp "  Enter $var (or press Enter to skip): " VAL
  fi
  if [ -z "$VAL" ]; then
    VAL="YOUR_${var}"
  fi
  ESCAPED_VAL=$(printf '%s\n' "$VAL" | sed 's/[&/\]/\\&/g')
  TEMPLATE=$(echo "$TEMPLATE" | sed "s/\${$var}/$ESCAPED_VAL/g")
done
echo "$TEMPLATE" > "$PI_DIR/models.json"
echo "  -> models.json generated (8 providers, 50+ models)"

# 4. Copy .env.example
if [ ! -f "$PI_DIR/.env" ] && [ -f "$SRC_DIR/bootstrap/.env.example" ]; then
  cp "$SRC_DIR/bootstrap/.env.example" "$PI_DIR/.env"
  echo "  -> .env example copied to $PI_DIR/.env"
fi

# 5. Copy extension files (for packages that work best as local files)
echo ""
echo "  Copying extensions..."
for ext in pi-ddg-search pi-ssh; do
  SRC="$SRC_DIR/packages/$ext/extensions"
  if [ -d "$SRC" ]; then
    cp "$SRC"/*.ts "$PI_DIR/extensions/" 2>/dev/null && echo "  -> $ext copied"
  fi
done

# 6. Install agent-browser for browser automation
if ! command -v agent-browser &>/dev/null; then
  echo ""
  echo "  Installing agent-browser..."
  npm install -g agent-browser 2>/dev/null || npm install agent-browser --prefix "$HOME/.local" 2>/dev/null || true
  echo "  agent-browser installed"
else
  echo "  agent-browser already installed"
fi

echo ""
echo "================================================"
echo "   Setup complete! Restart pi to apply."
echo "================================================"
echo ""
echo "  Your pi now has:"
echo "    - 8 providers, 50+ free models"
echo "    - Web search (ddg_search tool)"
echo "    - Browser automation (browser tool)"
echo "    - SSH remote execution (ssh flag)"
echo "    - Caveman mode enabled"
echo ""
echo "  Next:"
echo "    1. Edit $PI_DIR/.env for missing keys"
echo "    2. Restart pi"
echo "    3. /model to see all providers"
echo ""
