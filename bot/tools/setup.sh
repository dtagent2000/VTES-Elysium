#!/bin/bash
# setup.sh -- a session's setup, once per session (HARNESS "Sessions"; RULINGS D-139, 26 Nov 2026). Idempotent; run it from anywhere.
# It fetches what is never in git and says what the machine is:
#   1. KRCG's v5 card dump -> bot/vtes.json (krcg-v5.js; the dump files are ignored). A vtes.json younger than a day is kept;
#      --refresh fetches anew.
#   2. zero-vtes (Lionel Panhaleux's engine, MIT; a development-time reference, spec-card-sweep §5) cloned OUTSIDE the repository
#      and checked out at ZERO_PIN below, so two sessions read the same definitions. A round that moves the pin says so in its PR.
#      --zero DIR (default ~/zero-vtes); --zero-ref REF reads another commit for this session only.
#   3. --twda: KRCG's v5 TWDA -> bot/twda.json (only twd-profile.py / twd-archetypes.py read it).
#   4. node, python3, cores and memory (the suite wants a 6 GB heap; CI runs it, D-139).
# When static.krcg.org cannot be reached it prints how to copy the files from the private data repo (root CLAUDE.md) and exits 1.
# Usage: bash bot/tools/setup.sh [--refresh] [--twda] [--zero DIR] [--zero-ref REF]
set -u
B=$(cd "$(dirname "$0")/.." && pwd); R=$(cd "$B/.." && pwd)
ZERO_PIN=f9f227f   # zero-vtes's commit the sweep reads (26 Nov 2026: 2,130 CardDef statics in crates/engine/src/cards/defs.rs, 2,120 of them `pub static` cards)
ZERO_URL=https://github.com/lionel-panhaleux/zero-vtes
KRCG=https://static.krcg.org/data/v5
refresh=0; twda=0; zdir="$HOME/zero-vtes"; zref="$ZERO_PIN"; fail=0
while [ $# -gt 0 ]; do
  case "$1" in
    --refresh) refresh=1 ;;
    --twda) twda=1 ;;
    --zero) zdir="$2"; shift ;;
    --zero-ref) zref="$2"; shift ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "setup.sh: unknown argument $1" >&2; exit 2 ;;
  esac
  shift
done
say(){ printf '%-10s %s\n' "$1" "$2"; }
absp(){ python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$1"; }   # resolved from the caller's directory, nothing created
zabs=$(absp "$zdir"); zdir="$zabs"; rabs=$(absp "$R")

# 1. KRCG's cards
cd "$B" || exit 1
if [ "$refresh" = 0 ] && [ -s vtes.json ] && [ -n "$(find vtes.json -mmin -1440 2>/dev/null)" ]; then
  say vtes.json "kept ($(node -e "console.log(require('./vtes.json').length)") cards, younger than a day; --refresh to fetch)"
elif curl -fsSL --retry 3 -o vtes-v5.json "$KRCG/vtes.json" && curl -fsSL --retry 3 -o expansions.json "$KRCG/expansions.json"; then
  if out=$(node krcg-v5.js 2>&1); then say vtes.json "$(printf '%s' "$out" | tail -1)"; else say vtes.json "FAIL: krcg-v5.js: $(printf '%s' "$out" | tail -1)"; fail=1; fi
else
  say vtes.json "FAIL: static.krcg.org unreachable. Attach dtagent2000/VTES-Elysium-data read-only, copy its vtes-v5.json and"
  say "" "expansions.json into bot/ and run 'node krcg-v5.js' (root CLAUDE.md, 'Data that is not in git')."
  fail=1
fi
if [ "$twda" = 1 ]; then
  if curl -fsSL --retry 3 -o twda.json "$KRCG/twda.json" && python3 twda.py --check twda.json >/dev/null 2>&1; then say twda.json "fetched and read (twda.py --check)"
  else say twda.json "FAIL: fetch or twda.py --check (the data repo's twda-vdb.json, copied as twda.json, is the fallback)"; fail=1; fi
fi

# 2. zero-vtes, outside the repository, at the pin
case "$zabs/" in
  "$rabs/"*) say zero-vtes "FAIL: $zdir is inside the repository; clone it outside (spec-card-sweep §5)"; fail=1 ;;
  *)
    if [ ! -d "$zdir/.git" ]; then
      if [ -n "$(ls -A "$zdir" 2>/dev/null)" ]; then say zero-vtes "FAIL: $zdir exists and is not a git checkout"; fail=1
      else git clone --quiet "$ZERO_URL" "$zdir" 2>/dev/null || { say zero-vtes "FAIL: git clone $ZERO_URL"; fail=1; }; fi
    fi
    if [ -d "$zdir/.git" ]; then
      git -C "$zdir" cat-file -e "$zref^{commit}" 2>/dev/null || git -C "$zdir" fetch --quiet origin 2>/dev/null
      if git -C "$zdir" -c advice.detachedHead=false checkout --quiet "$zref" 2>/dev/null; then
        n=$(grep -c ': CardDef = CardDef' "$zdir/crates/engine/src/cards/defs.rs" 2>/dev/null)
        head=$(git -C "$zdir" rev-parse --short origin/HEAD 2>/dev/null || git -C "$zdir" rev-parse --short origin/main 2>/dev/null)
        say zero-vtes "$zdir at $(git -C "$zdir" log -1 --format='%h %cs') ($n CardDef statics)$( [ "$zref" = "$ZERO_PIN" ] && echo ', the pin' || echo ", NOT the pin $ZERO_PIN")$( [ -n "$head" ] && echo "; origin's head $head")"
      else say zero-vtes "FAIL: cannot check out $zref in $zdir"; fail=1; fi
    fi ;;
esac

# 3. the machine
say node "$(node --version 2>/dev/null || echo MISSING)"
say python3 "$(python3 --version 2>/dev/null | cut -d' ' -f2 || echo MISSING)"
say machine "$(node -e "const o=require('os');console.log(o.cpus().length+' cores, '+(o.totalmem()/2**30).toFixed(1)+' GB (the suite needs a 6 GB heap: CI runs the x3, D-139)')")"
[ "$fail" = 0 ] && say setup "OK" || say setup "FAIL (above)"
exit $fail
