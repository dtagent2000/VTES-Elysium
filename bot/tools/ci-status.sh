#!/bin/bash
# ci-status.sh -- CI's checks on a commit, and the suite runs' counts (RULINGS D-139, 26 Nov 2026: CI's suite x3 is the release gate).
# Prints every check run on the commit (name, status, conclusion) and each suite run's notice: its count line and the sha256 of the
# bytes it ran. Exit 0 when every check has completed green, 1 when one failed, 3 while one is still running.
# Usage: bash bot/tools/ci-status.sh [REF]     (default HEAD; push first: CI reads what GitHub has)
set -u
ref="${1:-HEAD}"; sha=$(git rev-parse "$ref" 2>/dev/null) || { echo "ci-status.sh: no such ref $ref" >&2; exit 2; }
repo="${GH_REPO:-$(git remote get-url origin | sed -E 's#\.git$##; s#^.*[/:]([^/]+/[^/]+)$#\1#')}"
runs=$(gh api "repos/$repo/commits/$sha/check-runs?per_page=100" --jq '.check_runs[] | [.id, .name, .status, (.conclusion // "-")] | @tsv' 2>&1) || { echo "ci-status.sh: $runs" >&2; exit 2; }
[ -n "$runs" ] || { echo "no check runs on $(git rev-parse --short "$sha") yet (pushed? CI starts within a minute)"; exit 3; }
echo "CI on $(git rev-parse --short "$sha") ($repo):"
rc=0
while IFS=$'\t' read -r id name status concl; do
  printf '  %-22s %-11s %s\n' "$name" "$status" "$concl"
  [ "$status" = completed ] || { [ "$rc" = 1 ] || rc=3; }
  case "$concl" in success|skipped|-|neutral) ;; *) rc=1 ;; esac
  case "$name" in bot-suite*) gh api "repos/$repo/check-runs/$id/annotations" --jq '.[] | select(.annotation_level == "notice") | "      " + .message' 2>/dev/null ;; esac
done <<< "$runs"
exit $rc
