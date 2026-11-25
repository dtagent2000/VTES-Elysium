#!/bin/bash
# doc-budget.sh -- the standing pages' check (spec-cleanup-2026-10-20.md §5.3). Run from anywhere; exit 1 on any failure.
#   1. each standing page within its byte budget; the bootstrap (root CLAUDE.md + bot/CLAUDE.md + STATUS + BOARD) <= 50 KB;
#      every standing page together <= 186 KB;
#   2. every repo path named (in backticks) in a standing page, and every bot/ path in the root CLAUDE.md, exists;
#   3. every version STATUS.md names agrees with the code: BOT_VERSION, the arena, the sim, the cardfx compiler, the hotseat
#      tool, the coverage tool, the read-only client / protocol / server copies in bot/ and the root's client / server (with
#      DOC_BUDGET_ROOT_DRIFT=warn, as CI sets it outside pull requests, a root newer than STATUS's line is a warning, not a failure).
# Portable to bash 3.2 (macOS): no associative arrays.
set -u
B=$(cd "$(dirname "$0")/.." && pwd); D="$B/docs"; R="$B/.."; fail=0
ok(){ printf 'ok    %s\n' "$*"; }
bad(){ printf 'FAIL  %s\n' "$*"; fail=1; }

# 1. budgets (bytes). RULINGS: the spec said 25 KB; 42 KB from C1 (PR #39) -- the register came to 171 lines, and the 20 Oct audit's
#    split of Johan's words from Claude's thresholds costs words; 60 KB and the total 160 KB since 29 Oct (Johan, RULINGS D-101: when a
#    page needs room the ceiling is raised -- the register grows with every round's rulings); BOARD 15 -> 18 KB the same day (it stood
#    15 bytes under its ceiling; the bootstrap's 50 KB stays the real guard); BOARD 18 -> 18.5 KB on 12 Nov (crypt wave A's egress
#    review found three asks no line held, with no history left to cut -- HARNESS; STATUS gave the bootstrap its bytes back); the
#    total 160 -> 165 KB on 13 Nov (bot v0.6.220: Johan's D-112 and D-113 and the riders' two found lines -- the register grows);
#    BOARD 18.5 -> 19 KB the same day (bot v0.6.221: the Jack round's three found asks, the bootstrap's 50 KB still the guard);
#    HOWTO 20 -> 21 KB the same day (bot v0.6.222: the tokens-in-browser diagnostic; the page stood 23 bytes under its ceiling).
#    ARCHITECTURE 15 -> 15.5 KB on 14 Nov (bot v0.6.225: a human's Grand Ball reader and the memo row; round B's Jack row had left
#    the page 1 byte under its ceiling). RULINGS 60 -> 62 KB and the total 165 -> 167 KB the same day (bot v0.6.226: Johan's D-115
#    and the open question it uncovered, O-41; the register stood 90 bytes under its ceiling after round C's compression).
#    RULINGS 62 -> 64 KB and the total 167 -> 170 KB on 15 Nov (bot v0.6.229: Johan's D-118, the bench round's answers; the register
#    stood 675 bytes under its ceiling and the total 591 bytes over it with the line).
#    HOWTO 21 -> 21.5 KB the same day (bot v0.6.229: the guide check's reader, ana-guide-check.py; the page stood 1 byte under its ceiling).
#    RULINGS 64 -> 65 KB, ARCHITECTURE 15.5 -> 16 KB and the total 170 -> 173 KB on 18 Nov (bot v0.6.233: Johan's D-123, the wave 6a
#    decisions, after the fold of five retired stubs; the register stood 287 bytes under its ceiling, the table 11, the total 258).
#    RULINGS 65 -> 66 KB and the total 173 -> 174 KB the same day (a docs round on bot v0.6.234: Johan's D-125, the V5 sweep's
#    method, after D-98's and D-102's card lists and the BOARD line's waves-done list were cut as history; the register stood 92 bytes
#    under its ceiling and the total 3).
#    RULINGS 66 -> 67 KB, HOWTO 21.5 -> 22.5 KB and the total 174 -> 177 KB on 19 Nov (the V5 sweep's step A1, bot v0.6.234, no bot
#    change). spec-card-sweep 4.1 planned 2 KB of room under the total and 1 KB under RULINGS "by cutting history the specs keep";
#    the read found 0.5 KB of history (D-101's first raises, D-108's wave count, D-109's lint story; HOWTO's bench controls and its
#    v3 note; two asides in CLAUDE.md), because the register holds rulings and HOWTO holds how-tos. The rest is this raise. HOWTO
#    stood 235 bytes under its ceiling and takes the sharing register now, zero-vtes's fetch line and the review sheet in step A2.
#    HARNESS 8 -> 8.5 KB, HOWTO 22.5 -> 23 KB and the total 177 -> 179 KB on 19 Nov (the sweep's step A2, bot v0.6.234, no bot
#    change): the charter's T2 sentence, the review sheet's how-to with zero-vtes's clone line, the dry run's lesson (L-97);
#    HARNESS stood 53 bytes under its ceiling, HOWTO 206 and the total 566. The total keeps 1.4 KB of room for B and C (spec-card-
#    sweep 4.1); STATUS gave the bootstrap the root CLAUDE.md's zero-vtes line and the finished decks' BOARD line.
#    RULINGS 67 -> 67.5 KB on 20 Nov (a docs round on bot v0.6.235; the total stays): Johan's D-128 and D-129. Cut first: O-47
#    and D-127's built story; the egress review then found the short D-129 said more than Johan had (a "No" for his "not now"),
#    and his hedges cost 0.2 KB the register did not have (it stood 39 bytes under its ceiling).
#    RULINGS 67.5 -> 68 KB and the total 179 -> 180 KB the same day (a docs round on bot v0.6.235, the library by effect):
#    Johan's D-130 and D-131 and the open O-48. Cut first: 0.9 KB of the register's built stories and measurements (D-17,
#    D-81, D-89, D-105, D-108, D-110, D-111, D-113, D-114, D-117, D-118, D-125; the CHANGELOG and the specs keep them) and
#    BOARD's done steps; the register stood 268 bytes over its ceiling and the total about 0.5 KB over it, and the
#    caller's read then gave back a reason the cut had taken (D-118: why the losing knob lost), which the 179.5 KB step had no room for.
#    RULINGS 68 -> 70 KB, HARNESS 8.5 -> 9 KB and the total 180 -> 182 KB the same day (a docs round on bot v0.6.235, before the
#    pilot): Johan's D-132 and D-133 and HARNESS's review until clean. Cut first: BOARD's card-reading asks folded into the V5
#    sweep's C riders (1.5 KB; their words in spec-v5-wave6 §8, spec-v5-wave2 §4, spec-card-sweep §11.10 and O-21) and D-123's measurement; the bootstrap's
#    50 KB stays. The register stood 1.4 KB over its ceiling, HARNESS 0.4 KB and the total 0.7 KB; the rest is the pilot's room.
#    RULINGS 70 -> 72 KB, LESSONS 20 -> 20.5 KB, ARCHITECTURE 16 -> 17 KB, HOWTO 23 -> 23.5 KB and the total 182 -> 186 KB the same
#    day (bot v0.6.236, the Banu Haqim pilot): D-134, R-46's readings, O-49, L-98, the rush / combat / set-up / action rows and the
#    suite's 6 GB heap. Nothing cut: the round before had cut the history there was and left the pilot 1.3 KB of the total, which
#    its record took; at the release the register stood 1.6 KB over its old ceiling, ARCHITECTURE 0.7, LESSONS 0.3, HOWTO 0.2 and the
#    total 3.1 KB (185,140 bytes).
#    RULINGS 72 -> 73 KB and the total 186 -> 187 KB on 24 Nov (bot v0.6.237, the playtest round): Johan's D-136 and the open O-50,
#    BOARD's chat round. Nothing cut: the register's history went in the rounds of 20 Nov; RULINGS stood 0.97 KB over, the total 14 bytes.
#    RULINGS 73 -> 73.5 KB the same day (bot v0.6.238, Dreams of the Sphinx): Johan's partial answer on O-50, his words; the register
#    stood 4 bytes under its ceiling (its egress review, pass 1: STATUS said it while RULINGS said "not answered").
#    RULINGS 73.5 -> 74.5 KB, LESSONS 20.5 -> 21 KB, HOWTO 23.5 -> 24 KB and the total 187 -> 190 KB on 25 Nov (bot v0.6.240, the
#    chat round): O-51 (the ruling doc's lines and R1-R9) and O-36's measurement, L-99, the chat tools, D-137 in CLAUDE.md's tier and
#    event-log rules. Cut first: the round's own lines (HOWTO's chat tools 0.7 -> 0.4 KB, L-99, BOARD's found line; O-36 and O-51
#    compacted); the register stood 0.8 KB over its ceiling, LESSONS 0.1, HOWTO 0.1 and the total 2.0 KB (the egress review's pass 1).
PAGES="$B/CLAUDE.md:25000 $D/STATUS.md:5000 $D/BOARD.md:19000 $D/RULINGS.md:74500 $D/LESSONS.md:21000
       $D/ARCHITECTURE.md:17000 $D/HARNESS.md:9000 $D/HOWTO.md:24000"
total=0
for pb in $PAGES; do
  f=${pb%:*}; lim=${pb##*:}
  if [ ! -f "$f" ]; then bad "missing $f"; continue; fi
  n=$(wc -c < "$f" | tr -d ' '); total=$((total + n))
  if [ "$n" -gt "$lim" ]; then bad "$(basename "$f") is $n bytes, budget $lim"; else ok "$(basename "$f") $n / $lim"; fi
done
boot=0; for f in "$R/CLAUDE.md" "$B/CLAUDE.md" "$D/STATUS.md" "$D/BOARD.md"; do boot=$((boot + $(wc -c < "$f" | tr -d ' '))); done
if [ "$boot" -gt 50000 ]; then bad "bootstrap is $boot bytes, budget 50000"; else ok "bootstrap $boot / 50000"; fi
if [ "$total" -gt 190000 ]; then bad "standing pages total $total bytes, budget 190000"; else ok "standing pages $total / 190000"; fi

# 2. paths named in the standing pages: a backticked token that looks like a file or a folder
missing=0
for pb in $PAGES; do
  f=${pb%:*}; [ -f "$f" ] || continue
  while read -r p; do
    case "$p" in *.md|*.js|*.py|*.sh|*.json|*.html|*.txt|*.csv|*.yml|*/) ;; *) continue ;; esac
    case "$p" in   # generated, scratch, planned, a pattern, or main's
      http*|*\**|*'<'*|*'>'*|*NNNN*|serie-*|bench-*|sim-*|snap-*|lab-*|/tmp/*|../*|client/*|.github/*|-*|.*) continue ;;
      twda.json|twda-vdb.json|vtes.json|vtes-v5.json|expansions.json|twd_decks.json|SUMMARY.md|PREDICTIONS.md|REPORT.md|design.txt|progress.txt) continue ;;
      suite.log|ev.jsonl|snap-suite.sh|runsec.sh|launch.sh|chain.sh|poll-home.sh|poll-seed.sh|poll-bal2.sh|run-smoke2.sh) continue ;;
      run-null4.sh|test-bot-sim-boundary.js|elysium-knowledge.json) continue ;;
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
done < <(grep -o '`bot/[A-Za-z0-9_./-]*`' "$R/CLAUDE.md" | tr -d '`' | grep -v '[<>*]' | grep -vE '^bot/(vtes|vtes-v5|expansions|twda|twda-vdb)\.json$' | sort -u)   # third-party data: fetched, never committed
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
# the root's release (main's note of 12 Nov 2026: each client or server release turned this check red on main until a bot round).
# On a pull request -- the default -- STATUS must name it: the PR's gates ran against it. Where CI sets DOC_BUDGET_ROOT_DRIFT=warn
# (a scheduled run, a push to main) a root NEWER than STATUS's line is a warning; a line the root cannot have had (newer than the
# root, or older in one part and newer in the other) fails either way.
vcmp(){ local IFS=.; local a=($1) b=($2) i; for i in 0 1 2; do [ "${a[$i]:-0}" -lt "${b[$i]:-0}" ] && { echo -1; return; }; [ "${a[$i]:-0}" -gt "${b[$i]:-0}" ] && { echo 1; return; }; done; echo 0; }
rc=$(v "$R/elysium-vtes-bord.html" "const VERSION='[0-9.]+'"); rs=$(v "$R/elysium-server.js" "const VERSION = '[0-9.]+'"); rw="client v$rc / srv-$rs"
case "$st" in
  *"$rw"*) ok "STATUS: $rw (the root's release)" ;;
  *) sl=$(printf '%s\n' "$st" | grep -oE 'client v[0-9]+\.[0-9]+\.[0-9]+ / srv-[0-9]+\.[0-9]+\.[0-9]+' | head -1)
     sc=$(printf '%s' "$sl" | sed -E 's#^client v([0-9.]+) / srv-([0-9.]+)$#\1#'); ss=$(printf '%s' "$sl" | sed -E 's#^client v([0-9.]+) / srv-([0-9.]+)$#\2#')
     if [ -z "$rc" ] || [ -z "$rs" ] || [ -z "$sl" ]; then bad "STATUS lacks '$rw' (the root's release in the code)"
     elif [ "$(vcmp "$rc" "$sc")" -ge 0 ] && [ "$(vcmp "$rs" "$ss")" -ge 0 ]; then
       if [ "${DOC_BUDGET_ROOT_DRIFT:-fail}" = warn ]; then
         printf 'WARN  STATUS names %s; the root has moved on to %s (main released since the last bot round, which updates the line)\n' "$sl" "$rw"
         [ -n "${GITHUB_ACTIONS:-}" ] && printf '::warning::STATUS names %s; the root is %s -- the next bot round updates the line\n' "$sl" "$rw"
       else bad "STATUS lacks '$rw' (the root's release in the code; STATUS names $sl)"; fi
     else bad "STATUS names $sl, a release the root cannot have had (the root is $rw)"; fi ;;
esac
want "bot/'s read-only copies" "copies in bot/ are client v$(v "$B/elysium-vtes-bord.html" "const VERSION='[0-9.]+'") / protocol v$(v "$B/ELYSIUM-PROTOCOL.md" "reflects client \*\*v[0-9.]+") / srv-$(v "$B/elysium-server.js" "const VERSION = '[0-9.]+'")"

[ "$fail" = 0 ] && echo "doc-budget: PASS" || echo "doc-budget: FAIL"
exit $fail
