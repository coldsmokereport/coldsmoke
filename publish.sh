#!/bin/bash
# Build The Cold Smoke Report and push it live.
# Usage: ./publish.sh "commit message"
set -euo pipefail
cd "$(dirname "$0")"
MSG="${1:-post: $(date +%Y-%m-%d)}"
git pull --rebase --autostash   # pick up CMS/CI commits made on GitHub
conda run -n snowclim python build.py
git add -A
git commit -m "$MSG"
git push
echo "pushed — live in a minute or two"
