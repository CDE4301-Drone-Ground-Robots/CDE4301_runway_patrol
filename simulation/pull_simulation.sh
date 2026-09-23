#!/usr/bin/env bash
# ==============================================================================
# Script: pull_simulation.sh
# Purpose: Pulls updates made to the remote 'simulation/' folder on GitHub
#          into your local runway_sim_ws workspace.
# ==============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo "🔄 Fetching latest origin/main from GitHub..."
git fetch origin main

# Check if simulation folder exists on origin/main
if ! git rev-parse origin/main:simulation >/dev/null 2>&1; then
    echo "⚠️ 'simulation/' directory not found on origin/main."
    exit 1
fi

SIM_TREE=$(git rev-parse origin/main:simulation)
LOCAL_TREE=$(git rev-parse HEAD^{tree})

if [ "$SIM_TREE" = "$LOCAL_TREE" ]; then
    echo "✅ Local simulation workspace is already up to date with origin/main:simulation."
    exit 0
fi

echo "📥 Applying remote simulation changes to local workspace..."
# Checkout remote simulation tree contents into working directory
TEMP_INDEX=".git/temp_index_pull_$$"
export GIT_INDEX_FILE="$TEMP_INDEX"

git read-tree "$SIM_TREE"
git checkout-index -a -f

rm -f "$TEMP_INDEX"
unset GIT_INDEX_FILE

# Commit pulled updates to local history
git add -A
if ! git diff --cached --quiet; then
    git commit -m "Pull latest updates from origin/main:simulation [$(date '+%Y-%m-%d %H:%M:%S')]"
    echo "✨ Successfully pulled and updated local workspace from origin/main:simulation!"
else
    echo "✅ Workspace matches origin/main:simulation."
fi
