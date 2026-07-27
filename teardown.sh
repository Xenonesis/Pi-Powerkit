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
  echo "    ~/.pi/agent/extensions/ddg-search.ts"
  echo "    ~/.pi/agent/extensions/ssh.ts"
  echo "    ~/.omp/agent/models.yml (custom providers section)"
  echo ""
  read -rp "  Continue? [y/N] " confirm
  [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && echo "  Cancelled." && exit 1
}

warn

# Pi
rm -f "$HOME/.pi/agent/models.json" 2>/dev/null && echo "  Removed ~/.pi/agent/models.json"
rm -f "$HOME/.pi/agent/extensions/ddg-search.ts" 2>/dev/null || true
rm -f "$HOME/.pi/agent/extensions/ssh.ts" 2>/dev/null || true

# OMP
OMP_FILE="$HOME/.omp/agent/models.yml"
[ -f "$OMP_FILE" ] && rm -f "$OMP_FILE" && echo "  Removed OMP models.yml"

echo ""
echo "  Done. Configs removed. Re-run setup.sh to regenerate."
echo "================================================"
