#!/usr/bin/env bash
# ==============================================================================
# Script: push_simulation.sh
# Purpose: Commits local workspace changes and pushes cleanly to the
#          'simulation/' folder on https://github.com/CDE4301-Drone-Ground-Robots/CDE4301_runway_patrol.git
# ==============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

# 1. Commit local changes if any uncommitted work exists
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git status --porcelain)" ]; then
    echo "📦 Staging and committing local workspace changes..."
    git add -A
    
    if [ -n "$1" ]; then
        COMMIT_MSG="$1"
    else
        read -rp "Enter commit message: " COMMIT_MSG
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="Update simulation workspace [$(date '+%Y-%m-%d %H:%M:%S')]"
        fi
    fi
    
    git commit -m "$COMMIT_MSG"
else
    echo "✅ No uncommitted local changes."
    if [ -n "$1" ]; then
        COMMIT_MSG="$1"
    else
        COMMIT_MSG="Sync simulation workspace [$(date '+%Y-%m-%d %H:%M:%S')]"
    fi
fi

# 2. Fetch latest origin/main
echo "🔄 Fetching latest origin/main from GitHub..."
git fetch origin main

# 3. Build synthetic tree mapping local root -> remote simulation/ folder
echo "🌲 Merging local workspace into remote 'simulation/' folder..."
LOCAL_HEAD=$(git rev-parse HEAD)
REMOTE_HEAD=$(git rev-parse origin/main)

TEMP_INDEX=".git/temp_index_push_$$"
export GIT_INDEX_FILE="$TEMP_INDEX"

# Read origin/main tree
git read-tree origin/main
# Clear existing simulation/ subtree in index
git rm --cached -r -q --ignore-unmatch simulation 2>/dev/null || true
# Inject current local HEAD as simulation/ subtree
git read-tree --prefix=simulation/ HEAD
NEW_TREE=$(git write-tree)

rm -f "$TEMP_INDEX"
unset GIT_INDEX_FILE

# 4. Create commit with origin/main as parent
NEW_COMMIT=$(git commit-tree "$NEW_TREE" -p "$REMOTE_HEAD" -m "$COMMIT_MSG")

# 5. Push commit to origin main
echo "🚀 Pushing to GitHub (origin main)..."
git push origin "${NEW_COMMIT}:refs/heads/main"

# Update origin/main tracking ref locally
git fetch origin main

echo ""
echo "✨ Successfully pushed simulation changes to origin/main!"
