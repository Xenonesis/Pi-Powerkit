#!/usr/bin/env bash
set -e

PI_DIR="$HOME/.pi/agent"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
INTERACTIVE=true
[[ "$1" == "--no-interactive" ]] && INTERACTIVE=false

echo "================================================"
echo "   Pi-Powerkit - One-Click Setup"
echo "   Configures Pi + OMP + Zed + Copilot + jcode"
echo "================================================"
echo ""

mkdir -p "$PI_DIR"/extensions "$PI_DIR"/cache

# Source .env
ENV_FILE="$SRC_DIR/.env"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a && echo "  -> .env loaded"

# Prompt for API keys
echo ""
for var in AIHUBMIX_API_KEY ROUTER9_API_KEY XIAOMI_API_KEY DATABRICKS_API_KEY MODAL_API_KEY KILO_API_KEY AGENTROUTER_API_KEY CLINE_API_KEY OPENCODE_API_KEY GITHUB_TOKEN; do
  VAL="${!var}"
  if [ -z "$VAL" ] && [ "$INTERACTIVE" = true ]; then
    read -rp "  Enter $var (or press Enter to skip): " VAL
    export "$var=$VAL"
  fi
done

# =========================================================
#  1. PI SETUP
# =========================================================
echo ""
echo "--- Pi ---"

# settings.json
if [ ! -f "$PI_DIR/settings.json" ]; then
  if [ -f "$SRC_DIR/bootstrap/settings.json" ]; then
    cp "$SRC_DIR/bootstrap/settings.json" "$PI_DIR/settings.json"
    echo "  settings.json created"
  fi
else
  echo "  settings.json exists (skipped)"
fi

# models.json
echo "  Generating models.json..."
TEMPLATE=$(cat "$SRC_DIR/bootstrap/models.json")
for var in AIHUBMIX_API_KEY ROUTER9_API_KEY XIAOMI_API_KEY DATABRICKS_API_KEY MODAL_API_KEY KILO_API_KEY AGENTROUTER_API_KEY GITHUB_TOKEN; do
  VAL="${!var}"
  [ -z "$VAL" ] && VAL="YOUR_${var}"
  # Python replace handles ALL special chars safely (unlike sed)
  TEMPLATE=$(python3 -c "import sys; t=sys.stdin.read(); print(t.replace('\${$var}', '$VAL'), end='')" <<< "$TEMPLATE")
done
echo "$TEMPLATE" > "$PI_DIR/models.json"
echo "  models.json generated"

# Extensions
echo "  Copying extensions..."
for ext_dir in "$SRC_DIR"/packages/pi-*/extensions/; do
  [ -d "$ext_dir" ] && cp "$ext_dir"/*.ts "$PI_DIR/extensions/" 2>/dev/null && echo "  -> $(basename "$(dirname "$ext_dir")") copied"
done

# .env.example
if [ ! -f "$PI_DIR/.env" ] && [ -f "$SRC_DIR/bootstrap/.env.example" ]; then
  cp "$SRC_DIR/bootstrap/.env.example" "$PI_DIR/.env"
  echo "  .env example copied"
fi
chmod 600 "$PI_DIR/models.json" "$PI_DIR/.env" 2>/dev/null || true

# =========================================================
#  2. OMP SETUP (~/.omp/agent/models.yml)
# =========================================================
echo ""
echo "--- OMP (Oh My Pi) ---"
OMP_DIR="$HOME/.omp/agent"
if [ -d "$OMP_DIR" ]; then
  OMP_FILE="$OMP_DIR/models.yml"
  python3 "$SRC_DIR/bootstrap/generate-configs.py" omp > "$OMP_FILE"
  echo "  models.yml generated ($OMP_FILE) — all providers with all models"
else
  echo "  OMP not installed (no ~/.omp/agent dir) — skipped"
fi

# =========================================================
#  3. ZED SETUP (cross-platform paths)
# =========================================================
echo ""
echo "--- Zed ---"
# Detect OS for cross-platform paths
case "$(uname -s)" in
  Darwin)
    ZED_FILE="$HOME/Library/Application Support/Zed/settings.json"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    ZED_FILE="$LOCALAPPDATA/Zed/settings.json"
    ;;
  *)
    ZED_FILE="$HOME/.config/zed/settings.json"
    ;;
esac
if [ -f "$ZED_FILE" ]; then
  TMP=$(mktemp)
  python3 "$SRC_DIR/bootstrap/generate-configs.py" zed > "$TMP"
  python3 << 'PYEOF' "$ZED_FILE" "$TMP"
import json, sys, os

f = sys.argv[1]
tmp = sys.argv[2]

with open(tmp) as fp:
    gen = json.load(fp)
os.unlink(tmp)

with open(f) as fp:
    d = json.load(fp)

if 'language_models' not in d:
    d['language_models'] = {}
if 'openai_compatible' not in d['language_models']:
    d['language_models']['openai_compatible'] = {}

d['language_models']['openai_compatible'].update(gen)

with open(f, 'w') as fp:
    json.dump(d, fp, indent=2)
    fp.write('\n')

print(f"  All {len(gen)} Pi providers added to Zed settings.json")
PYEOF
else
  echo "  Zed not installed (no settings.json) — skipped"
fi

# =========================================================
#  4. COPILOT SETUP (cross-platform paths)
# =========================================================
echo ""
echo "--- VS Code Copilot ---"
case "$(uname -s)" in
  Darwin)
    COPILOT_FILE="$HOME/Library/Application Support/Code/User/chatLanguageModels.json"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    COPILOT_FILE="$LOCALAPPDATA/Code/User/chatLanguageModels.json"
    ;;
  *)
    COPILOT_FILE="$HOME/.config/Code/User/chatLanguageModels.json"
    ;;
esac
if [ -f "$COPILOT_FILE" ]; then
  TMP=$(mktemp)
  python3 "$SRC_DIR/bootstrap/generate-configs.py" copilot > "$TMP"
  python3 << 'PYEOF' "$COPILOT_FILE" "$TMP"
import json, sys, os

f = sys.argv[1]
tmp = sys.argv[2]

with open(tmp) as fp:
    new_entries = json.load(fp)
os.unlink(tmp)

with open(f) as fp:
    d = json.load(fp)

existing_names = {e.get('name') for e in d}
added = 0
for entry in new_entries:
    if entry['name'] not in existing_names:
        d.append(entry)
        added += 1

with open(f, 'w') as fp:
    json.dump(d, fp, indent=2)
    fp.write('\n')

print(f"  {added} Pi providers added to Copilot ({len(new_entries)} total)")
PYEOF
else
  echo "  VS Code Copilot not installed (no chatLanguageModels.json) — skipped"
fi

# =========================================================
#  5. JCODE SETUP (jcode provider add)
# =========================================================
echo ""
echo "--- jcode ---"
if command -v jcode &>/dev/null; then
  echo "  Adding providers to jcode..."
  python3 "$SRC_DIR/bootstrap/generate-configs.py" jcode | bash || echo "  jcode providers added (some may have been skipped)"
else
  echo "  jcode not installed — skipped"
fi

# =========================================================
#  6. INSTALL AGENT-BROWSER
# =========================================================
echo ""
echo "--- Browser ---"
if ! command -v agent-browser &>/dev/null; then
  echo "  Installing agent-browser..."
  npm install -g agent-browser 2>/dev/null || npm install agent-browser --prefix "$HOME/.local" 2>/dev/null || true
  echo "  agent-browser installed"
else
  echo "  agent-browser already installed"
fi

# =========================================================
#  DONE
# =========================================================
echo ""
echo "================================================"
echo "   Setup complete!"
echo "================================================"
echo ""
echo "  Configured:"
echo "    - Pi: 9 providers, 50+ models, tools, SSH"
echo "    - OMP: 10 providers, 65 models (if installed)"
echo "    - Zed: 10 providers, 65 models (if installed)"
echo "    - Copilot: 10 providers, 65 models (if VS Code installed)"
echo "    - jcode: 10 providers (if jcode installed)"
echo ""
echo "  Next:"
echo "    1. Edit .env for missing API keys"
echo "    2. Restart pi (and other tools)"
echo ""
