#!/bin/bash
# doc-budget.sh -- the standing pages' budget check (spec-cleanup-2026-10-20.md §6.3). Run from anywhere; exits 1 on any failure.
#   1. each standing page is within its byte budget, and the bootstrap (root CLAUDE.md + bot/CLAUDE.md + STATUS + BOARD) <= 50 KB,
#      every standing page together <= 150 KB;
#   2. every repo path named in a standing page (backticked, relative to bot/ or bot/docs/) exists;
#   3. the version in STATUS.md agrees with BOT_VERSION in elysium-bot.js.
set -u
B=$(cd "$(dirname "$0")/.." && pwd); D="$B/docs"; fail=0
say(){ printf '%s\n' "$*"; }
bad(){ say "FAIL  $*"; fail=1; }
ok(){ say "ok    $*"; }

# 1. budgets (bytes)
declare -A BUDGET=( ["$B/CLAUDE.md"]=25000 ["$D/STATUS.md"]=5000 ["$D/BOARD.md"]=15000 ["$D/RULINGS.md"]=36000
                    ["$D/LESSONS.md"]=20000 ["$D/ARCHITECTURE.md"]=15000 ["$D/HARNESS.md"]=8000 ["$D/HOWTO.md"]=20000 )
total=0
for f in "${!BUDGET[@]}"; do
  if [ ! -f "$f" ]; then bad "missing $f"; continue; fi
  n=$(wc -c < "$f"); total=$((total + n))
  if [ "$n" -gt "${BUDGET[$f]}" ]; then bad "$(basename "$f") is $n bytes, budget ${BUDGET[$f]}"; else ok "$(basename "$f") $n / ${BUDGET[$f]}"; fi
done
boot=$(( $(wc -c < "$B/../CLAUDE.md") + $(wc -c < "$B/CLAUDE.md") + $(wc -c < "$D/STATUS.md") + $(wc -c < "$D/BOARD.md") ))
if [ "$boot" -gt 50000 ]; then bad "bootstrap is $boot bytes, budget 50000"; else ok "bootstrap $boot / 50000"; fi
if [ "$total" -gt 150000 ]; then bad "standing pages total $total bytes, budget 150000"; else ok "standing pages $total / 150000"; fi

# 2. paths named in the standing pages (a backticked token that looks like a file or a folder under bot/ or bot/docs/)
for f in "${!BUDGET[@]}"; do
  grep -o '`[A-Za-z0-9_./-]*`' "$f" | tr -d '`' | sort -u | while read -r p; do
    case "$p" in
      *.md|*.js|*.py|*.sh|*.json|*.html|*.txt|*.csv|*.yml|*/) ;;   # only file-looking tokens and folders
      *) continue ;;
    esac
    case "$p" in
      http*|*\**|*NNNN*|*'<'*|*'>'*|deck-\*.json|*-\*|match-NNNN.jsonl|serie-*|bench-*|sim-*|snap-*|lab-*|/tmp/*|../*|client/*|.github/*) continue ;;
      twda.json|twda-vdb.json|vtes.json|vtes-v5.json|twd_decks.json|SUMMARY.md|PREDICTIONS.md|REPORT.md|design.txt|progress.txt|suite.log|ev.jsonl|notes.md|snap-suite.sh|runsec.sh|launch.sh|chain.sh|poll-home.sh|poll-seed.sh|poll-bal2.sh|run-smoke2.sh|run-null4.sh|docs/CARDS.md|gen-card-ledger.js|ana-gates.py|test-bot-sim-boundary.js|test-bot-suffix.js|elysium-knowledge.json|REPORT-combat-series-table.txt|client-old.html|old-bot.js|elysium-soak-hotseat.js|elysium-test-harness.js|check-versions.js|client-gates.yml|bot-gates.yml|timing-windows.md|card-text-parsing.md|elysium-history-2026-09-09.md) continue ;;   # generated, scratch, planned, or main's
    esac
    p="${p#bot/}"; p="${p%/.js}"                                      # a leading bot/ and the json/.js shorthand
    case "$p" in -*|.*|deck-*/*.json) continue ;; esac                 # a cut-off name, or the deck-a/b/c.json shorthand
    case "$p" in REPLY-to-bot-*) [ -e "$B/../client/docs/handoffs/$p" ] && continue ;; esac   # main's replies live in client/
    found=0; for root in "$B" "$D" "$D/specs" "$D/reports" "$D/reviews" "$D/coverage" "$D/history" "$D/history/specs" "$D/history/handoffs" "$D/handoffs"; do [ -e "$root/$p" ] && found=1; done
    [ "$found" = 1 ] || { say "FAIL  $(basename "$f") names $p, which does not exist"; echo bad >> /tmp/doc-budget.$$; }
  done
done
if [ -f /tmp/doc-budget.$$ ]; then fail=1; rm -f /tmp/doc-budget.$$; else ok "every path named in a standing page exists"; fi

# 3. the version
bv=$(grep -o "BOT_VERSION = '[0-9.]*'" "$B/elysium-bot.js" | grep -o "[0-9.]*[0-9]")
sv=$(grep -o 'Bot v[0-9.]*[0-9]' "$D/STATUS.md" | head -1 | grep -o '[0-9.]*[0-9]')
if [ "$bv" = "$sv" ]; then ok "STATUS says v$sv = BOT_VERSION $bv"; else bad "STATUS says v$sv but BOT_VERSION is $bv"; fi

[ "$fail" = 0 ] && say "doc-budget: PASS" || say "doc-budget: FAIL"
exit $fail
