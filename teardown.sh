#!/usr/bin/env bash
# Pi-Powerkit Teardown — removes all generated configs
set -e

echo "================================================"
echo "   Pi-Powerkit - Teardown"
echo "================================================"
echo ""

warn() {
  echo "  WARNING: This will remove generated configs!"
  echo "  Files that will be deleted:"
  echo "    ~/.pi/agent/models.json"
  echo "    ~/.pi/agent/.env"
  echo "    ~/.pi/agent/extensions/*.ts (all extensions)"
  echo "    ~/.omp/agent/models.yml"
  echo "    Zed settings.json (aihubmix/router9 sections)"
  echo "    VS Code Copilot settings (AIHubMix section)"
  echo ""
  read -rp "  Continue? [y/N] " confirm
  [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && echo "  Cancelled." && exit 1
}

warn

# Pi configs
rm -f "$HOME/.pi/agent/models.json" 2>/dev/null && echo "  Removed ~/.pi/agent/models.json"
rm -f "$HOME/.pi/agent/.env" 2>/dev/null && echo "  Removed ~/.pi/agent/.env"
echo "  Removing extensions..."
for f in "$HOME"/.pi/agent/extensions/*.ts; do
  [ -f "$f" ] && rm -f "$f" && echo "    Removed $(basename "$f")"
done

# OMP
OMP_FILE="$HOME/.omp/agent/models.yml"
[ -f "$OMP_FILE" ] && rm -f "$OMP_FILE" && echo "  Removed OMP models.yml"

echo ""
echo "  Done. Configs removed. Re-run setup.sh to regenerate."
echo "================================================"
