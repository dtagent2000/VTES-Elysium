#!/bin/bash
# doc-budget.sh -- the standing pages' check (spec-cleanup-2026-10-20.md §5.3). Run from anywhere; exit 1 on any failure.
#   1. each standing page within its byte budget; the bootstrap (root CLAUDE.md + bot/CLAUDE.md + STATUS + BOARD) <= 50 KB;
#      every standing page together <= 160 KB;
#   2. every repo path named (in backticks) in a standing page, and every bot/ path in the root CLAUDE.md, exists;
#   3. every version STATUS.md names agrees with the code: BOT_VERSION, the arena, the sim, the cardfx compiler, the hotseat
#      tool, the coverage tool, the read-only client / protocol / server copies in bot/ and the root's client / server.
# Portable to bash 3.2 (macOS): no associative arrays.
set -u
B=$(cd "$(dirname "$0")/.." && pwd); D="$B/docs"; R="$B/.."; fail=0
ok(){ printf 'ok    %s\n' "$*"; }
bad(){ printf 'FAIL  %s\n' "$*"; fail=1; }

# 1. budgets (bytes). RULINGS: the spec said 25 KB; 42 KB from C1 (PR #39) -- the register came to 171 lines, and the 20 Oct audit's
#    split of Johan's words from Claude's thresholds costs words; 60 KB and the total 160 KB since 29 Oct (Johan, RULINGS D-101: when a
#    page needs room the ceiling is raised -- the register grows with every round's rulings); BOARD 15 -> 18 KB the same day (it stood
#    15 bytes under its ceiling; the bootstrap's 50 KB stays the real guard).
PAGES="$B/CLAUDE.md:25000 $D/STATUS.md:5000 $D/BOARD.md:18000 $D/RULINGS.md:60000 $D/LESSONS.md:20000
       $D/ARCHITECTURE.md:15000 $D/HARNESS.md:8000 $D/HOWTO.md:20000"
total=0
for pb in $PAGES; do
  f=${pb%:*}; lim=${pb##*:}
  if [ ! -f "$f" ]; then bad "missing $f"; continue; fi
  n=$(wc -c < "$f" | tr -d ' '); total=$((total + n))
  if [ "$n" -gt "$lim" ]; then bad "$(basename "$f") is $n bytes, budget $lim"; else ok "$(basename "$f") $n / $lim"; fi
done
boot=0; for f in "$R/CLAUDE.md" "$B/CLAUDE.md" "$D/STATUS.md" "$D/BOARD.md"; do boot=$((boot + $(wc -c < "$f" | tr -d ' '))); done
if [ "$boot" -gt 50000 ]; then bad "bootstrap is $boot bytes, budget 50000"; else ok "bootstrap $boot / 50000"; fi
if [ "$total" -gt 160000 ]; then bad "standing pages total $total bytes, budget 160000"; else ok "standing pages $total / 160000"; fi

# 2. paths named in the standing pages: a backticked token that looks like a file or a folder
missing=0
for pb in $PAGES; do
  f=${pb%:*}; [ -f "$f" ] || continue
  while read -r p; do
    case "$p" in *.md|*.js|*.py|*.sh|*.json|*.html|*.txt|*.csv|*.yml|*/) ;; *) continue ;; esac
    case "$p" in   # generated, scratch, planned, a pattern, or main's
      http*|*\**|*'<'*|*'>'*|*NNNN*|serie-*|bench-*|sim-*|snap-*|lab-*|/tmp/*|../*|client/*|.github/*|-*|.*) continue ;;
      twda.json|twda-vdb.json|vtes.json|vtes-v5.json|twd_decks.json|SUMMARY.md|PREDICTIONS.md|REPORT.md|design.txt|progress.txt) continue ;;
      suite.log|ev.jsonl|snap-suite.sh|runsec.sh|launch.sh|chain.sh|poll-home.sh|poll-seed.sh|poll-bal2.sh|run-smoke2.sh) continue ;;
      run-null4.sh|docs/CARDS.md|gen-card-ledger.js|ana-gates.py|test-bot-sim-boundary.js|elysium-knowledge.json) continue ;;
      client-old.html|old-bot.js|elysium-soak-hotseat.js|elysium-test-harness.js|check-versions.js|bot-gates.yml) continue ;;
      timing-windows.md|card-text-parsing.md|elysium-history-2026-09-09.md) continue ;;
    esac
    p="${p#bot/}"; p="${p%/.js}"; p="${p%/.json}"     # a leading bot/; the "x.json/.js" and "x.js/.json" shorthands
    case "$p" in deck-*/*.json) continue ;; esac       # the "deck-a/b/c.json" shorthand
    case "$p" in REPLY-to-bot-*) [ -e "$R/client/docs/handoffs/$p" ] && continue ;; esac   # main's replies live in client/
    found=0
    for root in "$B" "$D" "$D/specs" "$D/reports" "$D/reviews" "$D/coverage" "$D/handoffs" "$D/history" "$D/history/specs" "$D/history/handoffs"; do
      [ -e "$root/$p" ] && found=1
    done
    [ "$found" = 1 ] || { bad "$(basename "$f") names $p, which does not exist"; missing=1; }
  done < <(grep -o '`[A-Za-z0-9_./-]*`' "$f" | tr -d '`' | sort -u)
done
# ... and the bot paths the root CLAUDE.md names (the first file of every bootstrap)
while read -r p; do
  q="${p#bot/}"
  [ -e "$B/$q" ] || { bad "root CLAUDE.md names $p, which does not exist"; missing=1; }
done < <(grep -o '`bot/[A-Za-z0-9_./-]*`' "$R/CLAUDE.md" | tr -d '`' | grep -v '[<>*]' | sort -u)
[ "$missing" = 0 ] && ok "every path named in a standing page (and every bot/ path in the root CLAUDE.md) exists"

# 3. the versions STATUS names (STATUS read with * and ` stripped)
st=$(tr -d '*`' < "$D/STATUS.md")
want(){   # want <what> <expected text in STATUS>
  case "$st" in *"$2"*) ok "STATUS: $2 ($1)" ;; *) bad "STATUS lacks '$2' ($1 in the code)" ;; esac
}
v(){ grep -oE "$2" "$1" 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'; }
want BOT_VERSION              "Bot v$(v "$B/elysium-bot.js" "BOT_VERSION = '[0-9.]+'")"
want "the arena's banner"     "arena v$(v "$B/elysium-bot-arena.js" "arena v[0-9.]+ ")"
want SIM_VERSION              "sim table v$(v "$B/elysium-bot-sim.js" "SIM_VERSION = '[0-9.]+'")"
want FXC_VERSION              "cardfx compiler v$(v "$B/cardfx-compile.js" "FXC_VERSION = '[0-9.]+'")"
want "the hotseat tool"       "hotseat tool v$(v "$B/elysium-bot-hotseat.js" "elysium-bot-hotseat.js v[0-9.]+")"
want "the coverage tool"      "coverage tool v$(v "$B/gen-deck-coverage.js" "gen-deck-coverage.js v[0-9.]+")"
want "the root's release"     "client v$(v "$R/elysium-vtes-bord.html" "const VERSION='[0-9.]+'") / srv-$(v "$R/elysium-server.js" "const VERSION = '[0-9.]+'")"
want "bot/'s read-only copies" "copies in bot/ are client v$(v "$B/elysium-vtes-bord.html" "const VERSION='[0-9.]+'") / protocol v$(v "$B/ELYSIUM-PROTOCOL.md" "reflects client \*\*v[0-9.]+") / srv-$(v "$B/elysium-server.js" "const VERSION = '[0-9.]+'")"

[ "$fail" = 0 ] && echo "doc-budget: PASS" || echo "doc-budget: FAIL"
exit $fail
