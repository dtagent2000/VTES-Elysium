#!/bin/bash
# doc-budget.sh -- the standing pages' check (RULINGS D-145; HARNESS "One place for each fact"). Run from anywhere; exit 1 on any
# failure. Usage: bash bot/tools/doc-budget.sh [--base REF]   (tools/gates.sh passes the merge base, CI a pull request's base)
#   1. each standing page within its budget, the bootstrap (root CLAUDE.md + bot/CLAUDE.md + STATUS + BOARD) and every standing page
#      together within theirs (tools/doc-budgets.txt: a ceiling, one in, one out); with --base, a rise of the total or the
#      bootstrap names a D-line the base's RULINGS does not have (the owner's yes), and the pages' budgets together rise no
#      further than the total;
#   2. every repo path named (in backticks) in a standing page, and every bot/ path in the root CLAUDE.md, exists;
#   3. every version STATUS.md names agrees with the code: BOT_VERSION, the arena, the sim, the cardfx compiler, the hotseat
#      tool, the coverage tool, the read-only client / protocol / server copies in bot/ and the root's client / server (with
#      DOC_BUDGET_ROOT_DRIFT=warn, as CI sets it outside pull requests, a root newer than STATUS's line is a warning, not a failure);
#   4. the round record's copies (STATUS's gates block, the CHANGELOG entry's gate line) and every CHANGELOG entry's template
#      and cap: tools/round.py check.
# The budgets' history is git's and the CHANGELOG's. Portable to bash 3.2 (macOS): no associative arrays.
set -u
B=$(cd "$(dirname "$0")/.." && pwd); D="$B/docs"; R="$B/.."; fail=0; base=""
while [ $# -gt 0 ]; do
  case "$1" in --base) base="${2:-}"; shift ;; *) echo "doc-budget.sh: unknown argument $1" >&2; exit 2 ;; esac
  shift
done
ok(){ printf 'ok    %s\n' "$*"; }
bad(){ printf 'FAIL  %s\n' "$*"; fail=1; }

# 1. budgets (bytes), from tools/doc-budgets.txt
BUD="$B/tools/doc-budgets.txt"
[ -f "$BUD" ] || { echo "FAIL  no tools/doc-budgets.txt"; echo "doc-budget: FAIL"; exit 1; }
lim(){ awk -v k="$1" '!/^#/ && $1 == k {print $2; exit}' "${2:-$BUD}"; }            # lim KEY [FILE]
pagesum(){ awk '!/^#/ && NF >= 2 && $1 != "total" && $1 != "bootstrap" {s += $2} END {print s + 0}' "${1:-$BUD}"; }
total_lim=$(lim total); boot_lim=$(lim bootstrap)
PAGES=$(awk -v R="$R" '!/^#/ && NF >= 2 && $1 != "total" && $1 != "bootstrap" {print R "/" $1 ":" $2}' "$BUD")
total=0
for pb in $PAGES; do
  f=${pb%:*}; lim=${pb##*:}
  if [ ! -f "$f" ]; then bad "missing $f"; continue; fi
  n=$(wc -c < "$f" | tr -d ' '); total=$((total + n))
  if [ "$n" -gt "$lim" ]; then bad "$(basename "$f") is $n bytes, budget $lim"; else ok "$(basename "$f") $n / $lim"; fi
done
boot=0; for f in "$R/CLAUDE.md" "$B/CLAUDE.md" "$D/STATUS.md" "$D/BOARD.md"; do boot=$((boot + $(wc -c < "$f" | tr -d ' '))); done
if [ "$boot" -gt "$boot_lim" ]; then bad "bootstrap is $boot bytes, budget $boot_lim"; else ok "bootstrap $boot / $boot_lim"; fi
if [ "$total" -gt "$total_lim" ]; then bad "standing pages total $total bytes, budget $total_lim"; else ok "standing pages $total / $total_lim"; fi
# ... and their rise against the base (one in, one out)
if [ -z "$base" ]; then
  echo "note  no --base: the budgets' rise is checked by tools/gates.sh and CI"
elif ! git -C "$R" rev-parse -q --verify "$base^{commit}" > /dev/null; then
  bad "--base $base is not a commit here"
else
  old=$(mktemp); git -C "$R" show "$base:bot/tools/doc-budgets.txt" > "$old" 2>/dev/null || : > "$old"
  if [ ! -s "$old" ]; then
    ok "the base has no tools/doc-budgets.txt: this change brings it (the rise check starts with the next)"
  else
    newids=$(comm -13 <(git -C "$R" show "$base:bot/docs/RULINGS.md" 2>/dev/null | grep -oE '^- \*\*D-[0-9]+\*\*' | grep -oE 'D-[0-9]+' | sort -u) \
                      <(grep -oE '^- \*\*D-[0-9]+\*\*' "$D/RULINGS.md" | grep -oE 'D-[0-9]+' | sort -u))
    for k in total bootstrap; do
      o=$(lim "$k" "$old"); n=$(lim "$k"); id=$(awk -v k="$k" '!/^#/ && $1 == k {print $3; exit}' "$BUD")
      [ -n "$o" ] && [ -n "$n" ] || { bad "the $k budget is missing (base '$o', now '$n')"; continue; }
      if [ "$n" -gt "$o" ]; then
        if [ -n "$id" ] && printf '%s\n' "$newids" | grep -qx "$id"; then ok "the $k budget rises $o -> $n with $id, a ruling the base does not have"
        else bad "the $k budget rises $o -> $n without a new ruling: name a D-line the base's RULINGS does not have (the owner's yes, D-145), or archive something"; fi
      fi
    done
    os=$(pagesum "$old"); ns=$(pagesum); ot=$(lim total "$old"); nt=$(lim total); room=$(( nt > ot ? nt - ot : 0 ))
    if [ "$((ns - os))" -gt "$room" ]; then bad "the pages' budgets together rise $os -> $ns: a page borrows from another (one down, one up), or the total rises with a ruling"
    else ok "the budgets against the base: the pages together $os -> $ns, the total $ot -> $nt"; fi
  fi
  rm -f "$old"
fi

# 2. paths named in the standing pages: a backticked token that looks like a file or a folder
missing=0
for pb in $PAGES; do
  f=${pb%:*}; [ -f "$f" ] || continue
  while read -r p; do
    case "$p" in *.md|*.js|*.py|*.sh|*.json|*.html|*.txt|*.csv|*.yml|*/) ;; *) continue ;; esac
    case "$p" in   # generated, scratch, planned, a pattern, or main's
      http*|*\**|*'<'*|*'>'*|*NNNN*|serie-*|bench-*|sim-*|snap-*|lab-*|/tmp/*|../*|client/*|.github/*|bot-history/*|-*|.*) continue ;;   # bot-history/: the private data repo's (D-142)
      twda.json|twda-vdb.json|vtes.json|vtes-v5.json|expansions.json|twd_decks.json|SUMMARY.md|PREDICTIONS.md|REPORT.md|design.txt|progress.txt) continue ;;
      suite.log|ev.jsonl|snap-suite.sh|runsec.sh|launch.sh|chain.sh|poll-home.sh|poll-seed.sh|poll-bal2.sh|run-smoke2.sh) continue ;;
      run-null4.sh|test-bot-sim-boundary.js|elysium-knowledge.json|record.json|summary.md) continue ;;
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

# 4. the round record's copies and the CHANGELOG's template (tools/round.py check, D-145)
out4=$(python3 "$B/tools/round.py" check 2>&1) || fail=1
printf '%s\n' "$out4"

[ "$fail" = 0 ] && echo "doc-budget: PASS" || echo "doc-budget: FAIL"
exit $fail
