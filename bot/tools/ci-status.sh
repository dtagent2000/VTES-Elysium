#!/bin/bash
# ci-status.sh -- CI's checks on a commit, and the suite runs' counts (RULINGS D-139, 26 Nov 2026: CI's suite x3 is the release gate).
# Prints every check run on the commit (name, status, conclusion) and each suite run's notice: its count line and the sha256 of the
# bytes it ran. CI runs on a pull request (on its merge commit: each notice names the bytes that ran), so open the PR, a draft at
# the first push. Exit 0 when `bot-gates` (the required check, the last job) has completed green, 1 when a check failed, 3 while one
# is still running or not there yet.
# Usage: bash bot/tools/ci-status.sh [REF]     (default HEAD; from anywhere)
set -u
cd "$(dirname "$0")" || exit 2
ref="${1:-HEAD}"; sha=$(git rev-parse "$ref" 2>/dev/null) || { echo "ci-status.sh: no such ref $ref" >&2; exit 2; }
repo="${GH_REPO:-$(git remote get-url origin | sed -E 's#\.git$##; s#^.*[/:]([^/]+/[^/]+)$#\1#')}"
runs=$(gh api "repos/$repo/commits/$sha/check-runs?per_page=100" --jq '.check_runs[] | [.id, .name, .status, (.conclusion // "-")] | @tsv' 2>&1) || { echo "ci-status.sh: $runs" >&2; exit 2; }
[ -n "$runs" ] || { echo "no check runs on $(git rev-parse --short "$sha") yet: CI runs on a pull request (open one, a draft at the first push) and starts within a minute"; exit 3; }
echo "CI on $(git rev-parse --short "$sha") ($repo):"
rc=0
while IFS=$'\t' read -r id name status concl; do
  printf '  %-22s %-11s %s\n' "$name" "$status" "$concl"
  [ "$status" = completed ] || { [ "$rc" = 1 ] || rc=3; }
  case "$concl" in success|skipped|-|neutral) ;; *) rc=1 ;; esac
  case "$name" in bot-suite*) gh api "repos/$repo/check-runs/$id/annotations" --jq '.[] | select(.annotation_level == "notice") | "      " + .message' 2>/dev/null ;; esac
done <<< "$runs"
[ "$rc" = 0 ] && ! printf '%s\n' "$runs" | awk -F'\t' '$2 == "bot-gates" && $3 == "completed" && $4 == "success"' | grep -q . && { echo "  (bot-gates has not completed yet)"; rc=3; }
exit $rc
