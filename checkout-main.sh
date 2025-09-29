#!/bin/bash

# Script to fetch and checkout main branch for fe, curriculum, and interpreters

update_repo() {
    local repo_name=$1
    local repo_path=$2
    local emoji=$3

    echo "$emoji Updating $repo_name repository..."
    cd "$repo_path" || exit

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        echo "  📝 Stashing local changes..."
        git stash push -m "Auto-stash before checkout-main script"
        local stashed=true
    else
        local stashed=false
    fi

    # Fetch and checkout main
    git fetch origin
    git checkout main
    git pull origin main

    # Restore stashed changes if any
    if [ "$stashed" = true ]; then
        echo "  📝 Restoring stashed changes..."
        git stash pop
    fi

    echo "✅ $repo_name updated"
    echo ""
}

# Get the directory where this script is located (should be jiki/fe)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the parent directory (jiki)
JIKI_DIR="$(dirname "$SCRIPT_DIR")"

# Update all three repositories using relative paths
update_repo "fe" "$JIKI_DIR/fe" "📦"
update_repo "curriculum" "$JIKI_DIR/curriculum" "📚"
update_repo "interpreters" "$JIKI_DIR/interpreters" "🔧"

echo "🎉 All repositories updated to main branch!"
